package com.espero.yaade.services

import com.cronutils.model.CronType
import com.cronutils.model.definition.CronDefinitionBuilder
import com.cronutils.model.time.ExecutionTime
import com.cronutils.parser.CronParser
import com.espero.yaade.SCRIPT_RUNNER_TIMEOUT
import com.espero.yaade.db.DaoManager
import io.vertx.core.eventbus.DeliveryOptions
import io.vertx.core.eventbus.Message
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.util.concurrent.ConcurrentHashMap
import kotlin.jvm.optionals.getOrElse

class CronScriptRunner(private val daoManager: DaoManager) : CoroutineVerticle() {

    private var stopped = false
    private val cronParser =
        CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX))

    private val cronScripts = ConcurrentHashMap<Long, JsonObject>()
    private val runningScripts = ConcurrentHashMap<Long, Boolean>()

    public override suspend fun start() {
        initCronScripts()
        vertx.eventBus().consumer("cronjob.add", this::addCronScript)
        vertx.eventBus().consumer("cronjob.remove", this::removeCronScript)
        while (!stopped) {
            try {
                for (cronScript in cronScripts.values) {
                    launch {
                        runCronScript(cronScript)
                    }
                }
                vertx.timer(100).coAwait()
            } catch (e: InterruptedException) {
                Thread.currentThread().interrupt()
                break
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
    }

    private fun initCronScripts() {
        daoManager.jobScriptDao.getAll().forEach { cronScript ->
            cronScripts[cronScript.id] = cronScript.toJson()
        }
    }

    private suspend fun runCronScript(cronScript: JsonObject) {
        if (runningScripts[cronScript.getLong("id")] == true) {
            return
        }
        val enabled = cronScript.getJsonObject("data").getBoolean("enabled") ?: false
        if (!enabled) {
            return
        }
        val lastRun = cronScript.getJsonObject("data").getLong("lastRun") ?: 0
        val cronExpression = cronScript.getJsonObject("data").getString("cronExpression") ?: return
        if (cronExpression == "") {
            return
        }
        val executionTime = ExecutionTime.forCron(cronParser.parse(cronExpression))
        val zdtutc = Instant.ofEpochMilli(lastRun).atZone(ZoneId.systemDefault())
        val nextExecution = executionTime.nextExecution(zdtutc).getOrElse {
            throw RuntimeException("No next execution found")
        }
        val nowZoned =
            Instant.ofEpochMilli(System.currentTimeMillis()).atZone(ZoneId.systemDefault())
        if (nowZoned.isBefore(nextExecution)) {
            return
        }

        val script = cronScript.getJsonObject("data").getString("script")
        val collectionId = cronScript.getLong("collectionId")
        val envName = cronScript.getJsonObject("data").getString("selectedEnvName") ?: ""
        val owner = daoManager.userDao.getById(cronScript.getLong("ownerId"))
            ?: throw RuntimeException("Owner not found for id: " + cronScript.getLong("ownerId"))
        val ownerGroups = JsonArray(owner.groups().toList())
        var res: JsonObject? = null
        try {
            runningScripts[cronScript.getLong("id")] = true
            val msg = JsonObject()
                .put("script", script)
                .put("collectionId", collectionId)
                .put("envName", envName)
                .put("ownerGroups", ownerGroups)
            res = vertx.eventBus()
                .request<JsonObject>(
                    "script.run", msg, DeliveryOptions().setSendTimeout(
                        SCRIPT_RUNNER_TIMEOUT + 1000
                    )
                )
                .coAwait().body()
        } catch (e: Throwable) {
            e.printStackTrace()
        } finally {
            try {
                // NOTE: we get the latest version of the cron script from the database
                // to reduce the risk of accidental overwriting of other changes
                val newScript = daoManager.jobScriptDao.getById(cronScript.getLong("id"))
                    ?: throw RuntimeException("Script not found for id: " + cronScript.getLong("id"))
                val newData = newScript.jsonData().put("lastRun", System.currentTimeMillis())
                if (res != null) {
                    val results = newScript.jsonData().getJsonArray("results") ?: JsonArray()
                    results.add(res)
                    val maxResults = newScript.jsonData().getInteger("storeMaxResults") ?: 10
                    val newResults = JsonArray()
                    newResults.add(res)
                    for (i in 0 until maxResults.coerceAtMost(results.size()) - 1) {
                        newResults.add(results.getJsonObject(i))
                    }
                    newData.put("results", newResults)
                    newScript.setJsonData(newData)
                }
                daoManager.jobScriptDao.update(newScript)
                cronScripts[newScript.id] = newScript.toJson()
            } catch (e: Throwable) {
                e.printStackTrace()
            } finally {
                runningScripts[cronScript.getLong("id")] = false
            }
        }
    }

    private fun addCronScript(msg: Message<JsonObject>) {
        // TODO: for some fucking reason all owner ids are -1. and two requests are sent.
        val cronScript = msg.body()
        val lastRun: Long? =
            cronScripts[cronScript.getLong("id")]?.getJsonObject("data")?.getLong("lastRun")
        if (lastRun != null) {
            val newData =
                cronScript.getJsonObject("data").put("lastRun", System.currentTimeMillis())
            cronScript.put("data", newData)
        }
        cronScripts[cronScript.getLong("id")] = cronScript
    }

    private fun removeCronScript(msg: Message<Long>) {
        val id = msg.body()
        cronScripts.remove(id)
    }

    public override suspend fun stop() {
        stopped = true
    }
}
