package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CronScriptDb
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Vertx
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext

class ScriptRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun createScript(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val script = CronScriptDb(body)
        daoManager.cronScriptDao.create(script)
        vertx.eventBus().send("cronjob.add", JsonObject.mapFrom(script))
        ctx.end(script.toJson().encode())
    }

    suspend fun updateScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val script = daoManager.cronScriptDao.getById(id)
        if (script == null) {
            ctx.fail(404)
            return
        }
        val body = ctx.body().asJsonObject()
        script.data = body.encode().toByteArray()
        daoManager.cronScriptDao.update(script)
        vertx.eventBus().send("cronjob.add", script)
        ctx.end(script.toJson().encode())
    }

    suspend fun deleteScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val script = daoManager.cronScriptDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Script does not exist")
        daoManager.cronScriptDao.delete(script.id)
        vertx.eventBus().send("cronjob.remove", script.id)
        ctx.end()
    }

}
