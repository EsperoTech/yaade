package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.services.OpenApiService
import com.j256.ormlite.misc.TransactionManager
import io.swagger.v3.parser.OpenAPIV3Parser
import io.vertx.core.Vertx
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await
import org.apache.http.HttpStatus

class CollectionRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun getAllCollections(ctx: RoutingContext) {
        val username = ctx.user().principal().getString("username")
        val collections = if (daoManager.userDao.isAdmin(username))
            daoManager.collectionDao.getAll()
        else
            daoManager.userDao.getByUsername(username)?.let { daoManager.collectionDao.getForUser(it) } ?: listOf()

        val result = collections.map {
            val requests = daoManager.requestDao.getAllInCollection(it.id).map(RequestDb::toJson)
            it.toJson().put("requests", requests)
        }

        ctx.end(JsonArray(result).encode()).await()
    }

    suspend fun postCollection(ctx: RoutingContext) {
        val data = ctx.body().asJsonObject()
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId) ?: throw RuntimeException("User not found")
        val existingCollections = daoManager.collectionDao.getByUserAndName(user, data.getString("name"))
        if (existingCollections.isNotEmpty()) {
            ctx.fail(409)
            return
        }
        val newCollection = CollectionDb(data, userId)

        daoManager.collectionDao.create(newCollection)

        val result = newCollection.toJson().put("requests", JsonArray()).encode()
        ctx.end(result).await()
    }

    suspend fun putCollection(ctx: RoutingContext) {
        val newCollection = CollectionDb.fromUpdateRequest(ctx.body().asJsonObject())
        daoManager.collectionDao.update(newCollection)
        ctx.end().await()
    }

    suspend fun deleteCollection(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()

        TransactionManager.callInTransaction(daoManager.connectionSource) {
            daoManager.collectionDao.delete(id)
            daoManager.requestDao.deleteAllInCollection(id)
        }

        ctx.end().await()
    }

    suspend fun importOpenApiCollection(ctx: RoutingContext) {
        val basePath = ctx.queryParam("basePath").elementAtOrNull(0) ?: ""
        val groups = ctx.queryParam("groups").elementAtOrNull(0) ?: ""
        val userId = ctx.user().principal().getLong("id")
        val f = ctx.fileUploads().iterator().next()
        val openApi = OpenAPIV3Parser().read(f.uploadedFileName())

        val name = openApi.info.title ?: "OpenAPI"

        val data = JsonObject().put("name", name).put("groups", groups.split(","))

        val collection = CollectionDb(data, userId)
        daoManager.collectionDao.create(collection)

        val requests = OpenApiService.createRequestsFromOpenApi(openApi, basePath, collection.id)
        requests.forEach { daoManager.requestDao.create(it) }

        val requestsJson = requests.map(RequestDb::toJson)
        val collectionJson = collection.toJson().put("requests", requestsJson)

        vertx.fileSystem().delete(f.uploadedFileName()).await()

        ctx.end(collectionJson.encode()).await()
    }

    fun canUserReadCollection(ctx: RoutingContext, collection: CollectionDb?): Boolean {
        val username = ctx.user().principal().getString("username")
        val user = daoManager.userDao.getByUsername(username)

        if (user == null || collection == null) {
            ctx.fail(409)
            return false
        }

        if (!collection.canRead(user)) {
            ctx.fail(403)
            return false
        }

        return true
    }

    suspend fun createEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
        if (!canUserReadCollection(ctx, collection)) return

        try {
            val name = ctx.pathParam("env")
            val body: JsonObject? = ctx.body().asJsonObject()
            collection!!.createEnv(name, body)
            daoManager.collectionDao.update(collection)
            ctx.end().await()
        } catch (e: RuntimeException) {
            ctx.fail(HttpStatus.SC_CONFLICT)
        }
    }

    suspend fun getAllEnvs(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
        if (!canUserReadCollection(ctx, collection)) return
        ctx.end(collection!!.getAllEnvs().encode()).await()
    }

    suspend fun setEnvData(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
        if (!canUserReadCollection(ctx, collection)) return

        val data = ctx.body().asJsonObject()
        val name = ctx.pathParam("env")
        collection!!.setEnvData(name, data)
        daoManager.collectionDao.update(collection)
        ctx.end().await()
    }

    suspend fun deleteEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
        if (!canUserReadCollection(ctx, collection)) return

        val name = ctx.pathParam("env")
        collection!!.deleteEnv(name)
        daoManager.collectionDao.update(collection)
        ctx.end().await()
    }
}
