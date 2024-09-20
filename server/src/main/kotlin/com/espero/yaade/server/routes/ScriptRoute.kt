package com.espero.yaade.server.routes

import com.cronutils.model.CronType
import com.cronutils.model.definition.CronDefinitionBuilder
import com.cronutils.parser.CronParser
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CronScriptDb
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.RequestSender
import com.espero.yaade.services.ScriptRunner
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Vertx
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class ScriptRoute(
    private val daoManager: DaoManager,
    private val vertx: Vertx,
    requestSender: RequestSender
) {

    private val scriptRunner = ScriptRunner(requestSender, daoManager)

    private val cronParser =
        CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX))

    fun getScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val scripts = daoManager.cronScriptDao.get(id) ?: throw ServerError(
            HttpResponseStatus.NOT_FOUND.code(),
            "No script found for id: $id"
        )
        val collection = daoManager.collectionDao.getById(scripts.collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: ${scripts.collectionId}"
            )
        assertUserCanReadCollection(ctx, collection.id)
        ctx.end(scripts.toJson().encode())
    }

    fun createScript(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val collectionId = body.getLong("collectionId") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "Collection ID is required"
        )
        val name = body.getString("name") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "Name is required"
        )
        val script = CronScriptDb(collectionId, name)
        daoManager.cronScriptDao.create(script)
        vertx.eventBus().send("cronjob.add", JsonObject.mapFrom(script))
        ctx.end(script.toJson().encode())
    }

    suspend fun updateScript(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val collectionId = body.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
        assertUserCanReadCollection(ctx, collectionId)
        val cronExpression = body.getString("cronExpression")
        if (cronExpression != null && cronExpression != "") {
            try {
                cronParser.parse(cronExpression)
            } catch (e: Exception) {
                throw ServerError(
                    HttpResponseStatus.BAD_REQUEST.code(),
                    "Invalid cron expression: $cronExpression"
                )
            }
        }
        val newScript = CronScriptDb.fromUpdateRequest(body)
        daoManager.cronScriptDao.update(newScript)
        vertx.eventBus().send("cronjob.add", JsonObject.mapFrom(newScript))
        ctx.end().coAwait()
    }

    suspend fun deleteScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val script = daoManager.cronScriptDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Script does not exist")
        daoManager.cronScriptDao.delete(script.id)
        vertx.eventBus().send("cronjob.remove", script.id)
        ctx.end()
    }

    suspend fun runScript(ctx: RoutingContext) {
        val jsonScript = ctx.body().asJsonObject().getJsonObject("script") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No script provided"
        )
        val envName = ctx.body().asJsonObject().getString("envName") ?: ""
        val cronScript = CronScriptDb.fromUpdateRequest(jsonScript)
        val collection = daoManager.collectionDao.getById(cronScript.collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: ${cronScript.collectionId}"
            )
        assertUserCanReadCollection(ctx, collection.id)
        val scriptString = cronScript.jsonData().getString("script")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No script provided")
        var res: JsonObject? = null
        try {
            res = scriptRunner.run(scriptString, collection, envName)
        } catch (e: Throwable) {
            res = JsonObject()
                .put("success", false)
                .put("executionTime", System.currentTimeMillis())
                .put("error", e.message)
                .put("envName", envName)
            e.printStackTrace()
        } finally {
            try {
                // NOTE: we get the latest version of the cron script from the database
                // to reduce the risk of accidental overwriting of other changes
                val newScript = daoManager.cronScriptDao.getById(cronScript.id)
                    ?: throw RuntimeException("Script not found for id: " + cronScript.id)
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
                daoManager.cronScriptDao.update(newScript)
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
        val result = res?.encode() ?: ""
        ctx.end(result)
    }

    private fun assertUserCanReadCollection(ctx: RoutingContext, collectionId: Long) {
        val collection = daoManager.collectionDao.getById(collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: $collectionId"
            )
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User is not logged in")
        if (!collection.canRead(user))
            throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: $collectionId"
            )
    }

}
