package com.espero.yaade.services

import com.espero.yaade.SCRIPT_RUNNER_TIMEOUT
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.eventbus.EventBus
import io.vertx.core.eventbus.Message
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.coroutines.CoroutineVerticle
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.HostAccess
import org.graalvm.polyglot.HostAccess.Export
import org.graalvm.polyglot.SandboxPolicy
import org.graalvm.polyglot.Value
import org.graalvm.polyglot.proxy.ProxyObject
import org.openapitools.codegen.examples.Environment
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.concurrent.*
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

class ScriptRunner(private val daoManager: DaoManager) : CoroutineVerticle() {

    private val executor: ExecutorService = Executors.newCachedThreadPool()
    private val runtimeBuilder = ScriptRuntimeBuilder()
    private val contextBuilder = Context.newBuilder("js")
        .sandbox(SandboxPolicy.CONSTRAINED)
        .`in`(ByteArrayInputStream(ByteArray(0)))
        .allowHostAccess(HostAccess.CONSTRAINED)
        .option("engine.WarnInterpreterOnly", "false")
    private lateinit var indexFile: String
    private lateinit var interpolateFile: String

    public override suspend fun start() {
        val inputStream: InputStream = javaClass.getResourceAsStream("/index.js")
            ?: throw IllegalArgumentException("File not found in resources")
        indexFile = inputStream.bufferedReader().use { it.readText() }
        val interpolateStream: InputStream = javaClass.getResourceAsStream("/interpolate.js")
            ?: throw IllegalArgumentException("File not found in resources")
        interpolateFile = interpolateStream.bufferedReader().use { it.readText() }
        vertx.eventBus().consumer("script.run", this::run)
        CompletableFuture.runAsync({
            val context = newContext(ByteArrayOutputStream())
            runtimeBuilder.initRuntime(context)
            val globalBindings: Value = context.getBindings("js")
            globalBindings.putMember("hello", "world")
            context.eval("js", "console.log(hello)")
            context.close(true)
        }, executor)
    }

    fun run(msg: Message<JsonObject>) {
        val outReference = AtomicReference<ByteArrayOutputStream>()
        val contextReference = AtomicReference<Context>()
        val envName = msg.body().getString("envName")
        val f = CompletableFuture.supplyAsync({
            val script = msg.body().getString("script")
            val collectionId = msg.body().getLong("collectionId")
            val collection = daoManager.collectionDao.getById(collectionId)
                ?: throw IllegalArgumentException("Collection not found for id: $collectionId")
            val out = ByteArrayOutputStream()
            outReference.set(out)
            val context = newContext(out)
            contextReference.set(context)
            val continuation = ContinuationWrapper()
            val startTime = System.currentTimeMillis()
            val ownerGroups =
                msg.body().getJsonArray("ownerGroups", JsonArray()).map { it as String }.toSet()
            val additionalEnvData =
                msg.body().getJsonObject("additionalEnvData")
                    .associate { it.key to it.value as String }
            val globalBindings =
                createGlobalBindings(context, collection, envName, ownerGroups, additionalEnvData)
            globalBindings.putMember(
                "__continuation",
                continuation
            )
            runtimeBuilder.initRuntime(context)
            context.eval("js", indexFile.format(script))
            while (!continuation.finished.get() && System.currentTimeMillis() - startTime < SCRIPT_RUNNER_TIMEOUT) {
                Thread.sleep(10)
            }
            if (!continuation.finished.get()) {
                throw RuntimeException("Script execution timed out")
            }
            val result = createResult(globalBindings, envName ?: "")
            continuation.finished.set(false)
            globalBindings.getMember("__doCallback").execute(result.encode())
            while (!continuation.finished.get() && System.currentTimeMillis() - startTime < SCRIPT_RUNNER_TIMEOUT) {
                Thread.sleep(10)
            }
            if (!continuation.finished.get()) {
                throw RuntimeException("Script execution timed out")
            }
            result
        }, executor)
        // NOTE: we add a little extra timeout to better differentiate which timeout happened
        f.orTimeout(SCRIPT_RUNNER_TIMEOUT + 500, TimeUnit.MILLISECONDS)
            .whenComplete { result: JsonObject?, ex: Throwable? ->
                val out = outReference.get() ?: throw RuntimeException("Output stream not found")
                val context = contextReference.get() ?: throw RuntimeException("Context not found")
                val outPrint = out.toString()
                if (outPrint.trimIndent().isNotEmpty()) {
                    println(outPrint)
                }
                out.close()
                if (ex != null) {
                    context.close(true)
                    f.cancel(true)
                    val errorMessage = when (ex) {
                        is TimeoutException -> "Script execution timed out"
                        else -> ex.message
                    }
                    msg.reply(
                        JsonObject()
                            .put("success", false)
                            .put("executionTime", System.currentTimeMillis())
                            .put("error", errorMessage)
                            .put("envName", envName)
                    )
                } else {
                    context.close()
                    msg.reply(result)
                }
            }
    }

    private fun prepareExec(
        requestId: Long,
        envName: String?,
        ownerGroups: Set<String>
    ): CompletableFuture<JsonObject> {
        val request = daoManager.requestDao.getById(requestId)
            ?: throw IllegalArgumentException("Request not found for id: $requestId")
        val collection = daoManager.collectionDao.getById(request.collectionId)
            ?: throw IllegalArgumentException("Collection not found for id: ${request.collectionId}")
        if (collection.groups().intersect(ownerGroups)
                .isEmpty() && !ownerGroups.contains("admin")
        ) {
            throw IllegalArgumentException("Owner of script does not have the necessary permissions")
        }
        val parentTree = getParentTree(collection, ownerGroups)
        val envData = getMergedEnvData(collection, envName, parentTree)
        val requestHeaders = request.jsonData().getJsonArray("headers", JsonArray())
        val headers = getCollectionTreeHeaders(parentTree, requestHeaders)
        val requestData = request.jsonData().copy().put("headers", headers)
        return CompletableFuture.supplyAsync(
            { interpolate(requestData, collection, envName, envData ?: JsonObject()) },
            executor
        )
    }

    private fun getCollectionTreeHeaders(
        parentTree: List<CollectionDb>,
        headers: JsonArray
    ): JsonArray {
        val collectionHeaders = parentTree.reversed().fold(JsonArray()) { acc, c ->
            acc.addAll(c.jsonData().getJsonArray("headers", JsonArray()))
        }
        collectionHeaders.addAll(headers)
        val result = JsonArray()
        for (header in collectionHeaders) {
            if (header is JsonObject) {
                if (header.getBoolean("isEnabled", true)) {
                    result.add(header)
                }
            }
        }
        return result
    }

    private fun interpolate(
        request: JsonObject,
        collection: CollectionDb,
        envName: String?,
        envData: JsonObject,
    ): JsonObject {
        if (envName == null) {
            return request
        }
        val out = ByteArrayOutputStream()
        newContext(out).use { context ->
            runtimeBuilder.initRuntime(context)
            val globalBindings = context.getBindings("js")
            context.eval("js", interpolateFile)
            val res =
                globalBindings.getMember("interpolate").execute(request.encode(), envData.encode())
                    .asString()
            val outString = out.toString()
            if (outString.trimIndent().isNotEmpty()) {
                println(outString)
            }
            val result = JsonObject(res)
            val errors = result.getJsonArray("errors", JsonArray())
            if (errors.size() > 0) {
                throw RuntimeException(errors.encode())
            }
            return JsonObject()
                .put("data", result.getJsonObject("result"))
                .put("collectionId", collection.id)
                .put("envName", envName)
        }
    }

    private fun getParentTree(
        collection: CollectionDb,
        ownerGroups: Set<String>,
        i: Int = 0
    ): List<CollectionDb> {
        if (i > 10) {
            return emptyList()
        }
        if (!ownerGroups.contains("admin") && collection.groups().intersect(ownerGroups).isEmpty())
            throw RuntimeException("Owner of script does not have the necessary permissions")
        val parentId = collection.jsonData().getLong("parentId") ?: return listOf(collection)
        val c = daoManager.collectionDao.getById(parentId)
            ?: return listOf(collection)
        return listOf(collection) + getParentTree(c, ownerGroups, i + 1)
    }

    private fun getMergedEnvData(
        collection: CollectionDb,
        envName: String?,
        parentTree: List<CollectionDb>
    ): JsonObject? {
        if (envName == null) return null
        if (collection.jsonData().getJsonObject("envs")?.getJsonObject(envName) == null) return null
        val envs: MutableList<JsonObject> = mutableListOf()
        var currentEnvName = envName
        for (c in parentTree) {
            val envData = c.jsonData().getJsonObject("envs")?.getJsonObject(currentEnvName)
                ?: break
            envs.add(envData.getJsonObject("data"))
            currentEnvName = envData.getString("parentEnvName", "")
            if (currentEnvName.isEmpty()) break
        }
        return envs.reversed().fold(JsonObject()) { acc, json -> acc.mergeIn(json) }
    }

    private fun newContext(out: ByteArrayOutputStream): Context {
        return contextBuilder.out(out).err(out).build()
    }

    private fun createGlobalBindings(
        context: Context,
        collection: CollectionDb,
        envName: String?,
        ownerGroups: Set<String>,
        additionalEnvData: Map<String, String>
    ): Value {
        val globalBindings: Value = context.getBindings("js")
        globalBindings.putMember("__exec", Exec(vertx.eventBus(), ownerGroups, this))
        globalBindings.putMember(
            "env",
            Environment(
                collection,
                envName ?: "",
                daoManager,
                additionalEnvData
            )
        )
        return globalBindings
    }

    private fun createResult(globalBindings: Value, envName: String): JsonObject {
        val jasmineReport = getJasmineReport(globalBindings)
        val executionTime = System.currentTimeMillis()
        val logs = getLogs(globalBindings)
        val error = globalBindings.getMember("__internalError")?.asString()
        val success = error == null &&
                (jasmineReport == null || jasmineReport.getString("status") == "passed")
        return JsonObject()
            .put("success", success)
            .put("executionTime", executionTime)
            .put("jasmineReport", jasmineReport)
            .put("logs", logs)
            .put("error", error)
            .put("envName", envName)
    }

    private fun getJasmineReport(globalBindings: Value): JsonObject? {
        try {
            val report = globalBindings.getMember("jsApiReporter") ?: return null
            val suitesValue = report.getMember("suites").execute() ?: return null
            val rawSuites = suitesValue.asString()
            val suitesObject = JsonObject(rawSuites)
            val suites = suitesObject.map { it.value as JsonObject }
            val specsValue = report.getMember("specs").execute() ?: return null
            val rawSpecs = specsValue.asString()
            val specs = JsonArray(rawSpecs)

            val result = JsonArray()

            for (rawSpec in specs) {
                val spec = rawSpec as JsonObject
                val suiteId = spec.getString("parentSuiteId") ?: continue
                val suite = suites.find { it.getString("id") == suiteId } ?: continue
                val newSpecs = suite.getJsonArray("specs", JsonArray()).add(spec)
                suite.put("specs", newSpecs)
            }

            var overallStatus = "passed"

            for (suite in suites) {
                val sortedSpecs = suite.getJsonArray("specs", JsonArray()).map { it as JsonObject }
                    .sortedBy { it.getString("id") }
                suite.put("specs", JsonArray(sortedSpecs))
                var status = "passed"
                val suiteSpecs = suite.getJsonArray("specs", JsonArray())
                for (rawSpec in suiteSpecs) {
                    val spec = rawSpec as JsonObject
                    val specStatus = spec.getString("status", "passed")
                    if (specStatus == "failed") {
                        status = "failed"
                        overallStatus = "failed"
                        break
                    }
                }
                suite.put("status", status)
                val parentId = suite.getString("parentSuiteId")
                if (parentId == null) {
                    result.add(suite)
                    continue
                }
                val parent = suites.find { it.getString("id") == parentId } ?: continue
                val children = parent.getJsonArray("children", JsonArray()).add(suite)
                parent.put("children", children)
            }

            val sortedResult = result.map { it as JsonObject }.sortedBy { it.getString("id") }

            return JsonObject().put("suites", sortedResult).put("status", overallStatus)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return null
    }

    private fun getLogs(globalBindings: Value): JsonArray {
        val logs = globalBindings.getMember("__getInternalLogs").execute() ?: return JsonArray()
        val rawLogs = logs.asString()
        return JsonArray(rawLogs)
    }

    class ContinuationWrapper {

        var finished = AtomicBoolean(false)

        @Export
        fun resume() {
            finished.set(true)
        }

    }

    class FutureWrapper(val future: Future<Map<String, Any>>) {

        @Export
        fun onComplete(v: Value) {
            future.onComplete {
                if (!v.canExecute()) {
                    return@onComplete
                }
                if (it.succeeded()) {
                    v.execute(ProxyObject.fromMap(it.result()))
                } else {
                    v.execute(null, it.cause()?.message ?: "Unknown error")
                }
            }
        }

    }

    class Exec(
        private val eventBus: EventBus,
        private val ownerGroups: Set<String>,
        private val scriptRunner: ScriptRunner
    ) {

        @Export
        fun exec(
            requestId: Long,
            envName: String?
        ): FutureWrapper {
            val promise = Promise.promise<Map<String, Any>>()
            val f: CompletableFuture<JsonObject>?
            try {
                f = scriptRunner.prepareExec(requestId, envName, ownerGroups)
            } catch (e: Exception) {
                return FutureWrapper(Future.failedFuture(e))
            }

            f.orTimeout(30, TimeUnit.SECONDS)
                .whenComplete { res, err ->
                    if (err != null) {
                        f.cancel(true)
                        promise.fail(err.cause?.message ?: err.message ?: "Unknown error")
                        return@whenComplete
                    }
                    eventBus
                        .request<JsonObject>("request.send", res).onComplete {
                            if (it.succeeded()) {
                                promise.complete(it.result().body().map)
                            } else {
                                promise.fail(it.cause())
                            }
                        }
                }
            return FutureWrapper(promise.future())
        }
    }
}
