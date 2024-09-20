package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.HostAccess
import org.graalvm.polyglot.HostAccess.Export
import org.graalvm.polyglot.SandboxPolicy
import org.graalvm.polyglot.Value
import org.openapitools.codegen.examples.Environment
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.concurrent.Executors
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class ScriptRunner(private val requestSender: RequestSender, private val daoManager: DaoManager) {

    val executor = Executors.newFixedThreadPool(3)

    class ContinuationWrapper(private val continuation: Continuation<Boolean>) {

        @Export
        fun resume() {
            continuation.resume(true)
        }

    }

    class Exec(
        private val daoManager: DaoManager,
        private val requestSender: RequestSender,
        private val scriptRunner: ScriptRunner
    ) {

        @Export
        fun exec(
            requestId: Long,
            envName: String?
        ): RequestSender.CompletableFutureWrapper {
            val request = daoManager.requestDao.getById(requestId)
                ?: throw IllegalArgumentException("Request not found: ${requestId}}")
            val collection = daoManager.collectionDao.getById(request.collectionId)
                ?: throw IllegalArgumentException("Collection not found: ${request.collectionId}")
            try {
                val res = scriptRunner.interpolate(request.toJson(), collection, envName)
                val result = res.getJsonObject("result")
                val errors = res.getJsonArray("errors") ?: JsonArray()
                if (errors.size() > 0) {
                    throw IllegalArgumentException("Failed to interpolate request: $requestId")
                }
                return requestSender.exec(result, collection, envName)
            } catch (e: Throwable) {
                throw IllegalArgumentException("Failed to interpolate request: $requestId")
            }
        }
    }

    private val indexFile: String
    private val interpolateFile: String

    init {
        val inputStream: InputStream = javaClass.getResourceAsStream("/index.js")
            ?: throw IllegalArgumentException("File not found in resources")
        indexFile = inputStream.bufferedReader().use { it.readText() }
        val interpolateStream: InputStream = javaClass.getResourceAsStream("/interpolate.js")
            ?: throw IllegalArgumentException("File not found in resources")
        interpolateFile = interpolateStream.bufferedReader().use { it.readText() }
    }

    suspend fun run(script: String, collection: CollectionDb, envName: String?): JsonObject {
        val out = ByteArrayOutputStream()
        return try {
            withTimeout(5_000) {
                withContext(Dispatchers.IO) {
                    newContext(out).use { context ->
                        val globalBindings = createGlobalBindings(context, collection, envName)
                        val builder = ScriptRuntimeBuilder(context)
                        suspendCoroutine { continuation ->
                            globalBindings.putMember(
                                "__continuation",
                                ContinuationWrapper(continuation)
                            )
                            builder.evalScript(context, indexFile.format(script))
                        }
                        println(out.toString())
                        val res = createResult(globalBindings, envName ?: "")
                        globalBindings.getMember("__doCallback").execute(res.encode())
                        return@withContext res
                    }
                }
            }
        } catch (e: TimeoutCancellationException) {
            println("Script execution timed out")
            JsonObject()
                .put("success", false)
                .put("executionTime", System.currentTimeMillis())
                .put("error", e.message)
                .put("envName", envName)
        } catch (e: Throwable) {
            println("An error occured while running the script: ${e.message}")
            JsonObject()
                .put("success", false)
                .put("executionTime", System.currentTimeMillis())
                .put("error", e.message)
                .put("envName", envName)
        }
    }

    private fun interpolate(
        request: JsonObject,
        collection: CollectionDb,
        envName: String?,
    ): JsonObject {
        if (envName == null) {
            return request
        }
        val env = collection.getEnv(envName) ?: JsonObject()
        val envData = env.getJsonObject("data") ?: JsonObject()
        val out = ByteArrayOutputStream()
        newContext(out).use { context ->
            val globalBindings = createGlobalBindings(context, collection, envName)
            val builder = ScriptRuntimeBuilder(context)
            builder.evalScript(context, interpolateFile)
            val res =
                globalBindings.getMember("interpolate").execute(request.encode(), envData.encode())
                    .asString()
            println(out.toString())
            return JsonObject(res)
        }
    }

    private fun newContext(out: ByteArrayOutputStream): Context {
        return Context.newBuilder("js")
            .sandbox(SandboxPolicy.CONSTRAINED)
            .`in`(ByteArrayInputStream(ByteArray(0)))
            .out(out)
            .err(ByteArrayOutputStream())
            .allowHostAccess(HostAccess.CONSTRAINED)
            .build()
    }

    private fun createGlobalBindings(
        context: Context,
        collection: CollectionDb,
        envName: String?
    ): Value {
        val globalBindings: Value = context.getBindings("js")
        globalBindings.putMember("__exec", Exec(daoManager, requestSender, this))
        globalBindings.putMember(
            "env",
            Environment(
                collection,
                envName ?: "",
                daoManager
            )
        )
        return globalBindings
    }

    private fun createResult(globalBindings: Value, envName: String): JsonObject {
        val jasmineReport = getJasmineReport(globalBindings)
        val executionTime = System.currentTimeMillis()
        val logs = getLogs(globalBindings)
        val error = globalBindings.getMember("__internalError")?.asString()
        val success = error == null
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

            return JsonObject().put("suites", sortedResult)
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
}
