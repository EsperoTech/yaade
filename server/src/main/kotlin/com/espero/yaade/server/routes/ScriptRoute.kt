package com.espero.yaade.server.routes

import com.cronutils.model.CronType
import com.cronutils.model.definition.CronDefinitionBuilder
import com.cronutils.parser.CronParser
import com.espero.yaade.SCRIPT_RUNNER_TIMEOUT
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.JobScriptDb
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Vertx
import io.vertx.core.eventbus.DeliveryOptions
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class ScriptRoute(
    private val daoManager: DaoManager,
    private val vertx: Vertx,
) {

    private val cronParser =
        CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX))

    fun getScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val scripts = daoManager.jobScriptDao.get(id) ?: throw ServerError(
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
        val ownerId = ctx.user().principal().getLong("id")
        val collectionId = body.getLong("collectionId") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "Collection ID is required"
        )
        val data = body.getJsonObject("data") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "Data is required"
        )
        val script = JobScriptDb(collectionId, ownerId, data)
        daoManager.jobScriptDao.create(script)
        vertx.eventBus().send("cronjob.add", script.toJson())
        ctx.end(script.toJson().encode())
    }

    suspend fun updateScript(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val collectionId = body.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
        assertUserCanReadCollection(ctx, collectionId)
        val cronExpression = body.getJsonObject("data", JsonObject()).getString("cronExpression")
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
        val oldScript = daoManager.jobScriptDao.getById(body.getLong("id"))
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Script does not exist")
        val newScript = JobScriptDb.fromUpdateRequest(body, oldScript.ownerId)
        daoManager.jobScriptDao.update(newScript)
        vertx.eventBus().send("cronjob.add", newScript.toJson())
        ctx.end().coAwait()
    }

    fun deleteScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val script = daoManager.jobScriptDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Script does not exist")
        daoManager.jobScriptDao.delete(script.id)
        vertx.eventBus().send("cronjob.remove", script.id)
        ctx.end()
    }

    fun takeOwnership(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val newOwnerId = ctx.user().principal().getLong("id")
        val script = daoManager.jobScriptDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Script does not exist")
        script.ownerId = newOwnerId
        daoManager.jobScriptDao.update(script)
        vertx.eventBus().send("cronjob.add", script.toJson())
        ctx.end()
    }

    fun tokenListScripts(ctx: RoutingContext) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User is not logged in")
        val rawCollections = if (daoManager.userDao.isAdmin(userId))
            daoManager.collectionDao.getAll()
        else {
            daoManager.collectionDao.getForUser(user)
        }

        val scripts = daoManager.jobScriptDao.getAll()
        val result = JsonArray()
        for (script in scripts) {
            val collection = rawCollections.find { it.id == script.collectionId }
            if (collection != null && collection.canRead(user)) {
                val scriptJson = script.toJson()
                val collectionJson = collection.toJson()
                result.add(
                    JsonObject().put(
                        "scriptName",
                        scriptJson.getJsonObject("data")?.getString("name")
                    )
                        .put(
                            "scriptDescription",
                            scriptJson.getJsonObject("data")?.getString("description")
                        )
                        .put(
                            "collectionName",
                            collectionJson.getJsonObject("data")?.getString("name")
                        )
                        .put(
                            "collectionDescription",
                            collectionJson.getJsonObject("data")?.getString("description")
                        )
                        .put("availableEnvs", collection.getAvailableEnvNames())
                        .put("collectionId", collectionJson.getLong("id"))
                        .put("scriptId", scriptJson.getLong("id"))
                )
            }
        }
        ctx.end(result.encode())
    }

    suspend fun tokenRunScript(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val envName = ctx.queryParam("env").firstOrNull()
        val jobScript = daoManager.jobScriptDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Script does not exist")
        val collection = daoManager.collectionDao.getById(jobScript.collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: ${jobScript.collectionId}"
            )
        assertUserCanReadCollection(ctx, collection.id)
        val ownerGroups =
            ctx.user().principal().getJsonObject("data", JsonObject())
                .getJsonArray("groups", JsonArray())
        val scriptString = jobScript.jsonData().getString("script")
        val result =
            run(jobScript.id, scriptString, jobScript.collectionId, envName ?: "", ownerGroups)
                ?: throw ServerError(
                    HttpResponseStatus.INTERNAL_SERVER_ERROR.code(),
                    "Script failed"
                )
        ctx.response().putHeader("Content-Type", "application/json")
        if (result.getBoolean("success", false)) {
            ctx.response().setStatusCode(HttpResponseStatus.OK.code())
        } else {
            ctx.response().setStatusCode(HttpResponseStatus.BAD_REQUEST.code())
        }
        ctx.end(result.encodePrettily())
    }

    suspend fun runScript(ctx: RoutingContext) {
        val jsonScript = ctx.body().asJsonObject().getJsonObject("script") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No script provided"
        )
        val envName = ctx.body().asJsonObject().getString("envName") ?: ""
        val userId = ctx.user().principal().getLong("id")
        val owner = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User is not logged in")
        val jobScript = JobScriptDb.fromUpdateRequest(jsonScript, userId)
        val collection = daoManager.collectionDao.getById(jobScript.collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: ${jobScript.collectionId}"
            )
        assertUserCanReadCollection(ctx, collection.id)
        val ownerGroups = JsonArray(owner.groups().toList())
        val scriptString = jobScript.jsonData().getString("script")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No script provided")
        val result = run(jobScript.id, scriptString, jobScript.collectionId, envName, ownerGroups)
            ?: throw ServerError(HttpResponseStatus.INTERNAL_SERVER_ERROR.code(), "Script failed")
        ctx.end(result.encode())
    }

    suspend fun run(
        scriptId: Long,
        scriptString: String,
        collectionId: Long,
        envName: String?,
        ownerGroups: JsonArray
    ): JsonObject? {
        var res: JsonObject? = null
        try {
            val msg = JsonObject()
                .put("script", scriptString)
                .put("collectionId", collectionId)
                .put("envName", envName)
                .put("ownerGroups", ownerGroups)
            res = vertx.eventBus()
                .request<JsonObject>(
                    "script.run",
                    msg,
                    DeliveryOptions().setSendTimeout(SCRIPT_RUNNER_TIMEOUT + 1000)
                )
                .coAwait().body()
        } catch (e: Throwable) {
            res = JsonObject()
                .put("success", false)
                .put("executionTime", System.currentTimeMillis())
                .put("error", e.message)
                .put("envName", envName)
            e.printStackTrace()
        } finally {
            try {
                // NOTE: we get the latest version of the job script from the database
                // to reduce the risk of accidental overwriting of other changes
                val newScript = daoManager.jobScriptDao.getById(scriptId)
                    ?: throw RuntimeException("Script not found for id: $scriptId")
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
            } catch (e: Throwable) {
                e.printStackTrace()
            }
        }
        return res
    }

    suspend fun moveScript(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val id = ctx.pathParam("id").toLong()
        val newCollectionId = body.getLong("newCollectionId")
        val script = daoManager.jobScriptDao.getById(id)
            ?: throw RuntimeException("Job Script not found")
        assertUserCanReadCollection(ctx, script.collectionId)

        if (newCollectionId != null) {
            assertUserCanReadCollection(ctx, newCollectionId)
        }

        val oldCollectionId = script.collectionId

        val newScripts = daoManager.jobScriptDao.getAllInCollection(newCollectionId)
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
            .toMutableList()

        if (oldCollectionId == newCollectionId) {
            newScripts.removeIf { c -> c.id == id }
        } else {
            script.collectionId = newCollectionId
            daoManager.jobScriptDao.update(script)
            val oldScripts = daoManager.jobScriptDao
                .getAllInCollection(oldCollectionId)
                .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
                .toMutableList()
            oldScripts.removeIf { c -> c.id == id }
            oldScripts.forEachIndexed { index, s ->
                s.patchData(JsonObject().put("rank", index))
                daoManager.jobScriptDao.update(s)
            }
        }

        val newRank = body.getInteger("newRank") ?: 0
        newScripts.add(newRank, script)
        newScripts.forEachIndexed { index, s ->
            s.patchData(JsonObject().put("rank", index))
            daoManager.jobScriptDao.update(s)
        }

        ctx.end().coAwait()
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
