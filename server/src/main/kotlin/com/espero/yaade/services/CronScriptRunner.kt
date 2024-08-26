package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CronScriptDb
import io.vertx.core.eventbus.Message
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait
import java.util.concurrent.ConcurrentHashMap

class CronScriptRunner(
    private val daoManager: DaoManager,
    requestSender: RequestSender
) :
    CoroutineVerticle() {

    private var stopped = false

    private val cronScripts = ConcurrentHashMap<Long, CronScriptDb>()
    private val scriptRunner: ScriptRunner = ScriptRunner(requestSender)

    public override suspend fun start() {
        initCronScripts()
        vertx.eventBus().consumer("cronjob.add", this::addCronScript);
        vertx.eventBus().consumer("cronjob.remove", this::removeCronScript);
        while (!stopped) {
            try {
                cronScripts.values.forEach(this::runCronScript)
                vertx.timer(1000).coAwait()
            } catch (e: InterruptedException) {
                Thread.currentThread().interrupt()
                break
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
    }

    private fun initCronScripts() {
        daoManager.cronScriptDao.getAll().forEach { cronScript ->
            cronScripts[cronScript.id] = cronScript
        }
    }

    // TODO: make this function suspendable
    private fun runCronScript(cronScript: CronScriptDb) {
        val lastRun = cronScript.jsonData().getLong("lastRun") ?: 0
        val interval = cronScript.jsonData().getLong("interval") ?: Long.MAX_VALUE
        if (System.currentTimeMillis() - lastRun < interval) {
            return
        }
        val script = cronScript.jsonData().getString("script")
        try {
            scriptRunner.run(script)
        } catch (e: Throwable) {
            e.printStackTrace()
        } finally {
            val newData = cronScript.jsonData().put("lastRun", System.currentTimeMillis())
            cronScript.setData(newData)
            daoManager.cronScriptDao.update(cronScript)
            cronScripts[cronScript.id] = cronScript
        }
    }

    private fun addCronScript(msg: Message<JsonObject>) {
        val cronScript = msg.body().mapTo(CronScriptDb::class.java)
        cronScripts[cronScript.id] = cronScript
    }

    private fun removeCronScript(msg: Message<Long>) {
        val id = msg.body()
        cronScripts.remove(id)
    }

    public override suspend fun stop() {
        stopped = true
    }
}
