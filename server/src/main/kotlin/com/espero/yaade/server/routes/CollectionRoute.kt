package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.services.OpenApiService
import com.j256.ormlite.misc.TransactionManager
import io.swagger.v3.parser.OpenAPIV3Parser
import io.vertx.core.Vertx
import io.vertx.core.json.JsonArray
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await

class CollectionRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun getAllCollections(ctx: RoutingContext) {
        val collections = daoManager.collectionDao.getAll().map {
            val requests = daoManager.requestDao.getAllInCollection(it.id).map(RequestDb::toJson)
            it.toJson().put("requests", requests)
        }

        ctx.end(JsonArray(collections).encode()).await()
    }

    suspend fun postCollection(ctx: RoutingContext) {
        val request = ctx.bodyAsJson
        val userId = ctx.user().principal().getLong("id")
        val newCollection = CollectionDb(request.getString("name"), userId)

        daoManager.collectionDao.create(newCollection)

        ctx.end(newCollection.toJson().put("requests", JsonArray()).encode()).await()
    }

    suspend fun putCollection(ctx: RoutingContext) {
        val newCollection = CollectionDb.fromUpdateRequest(ctx.bodyAsJson)
        daoManager.collectionDao.update(newCollection)
        ctx.end().await()
    }

    suspend fun deleteCollection(ctx: RoutingContext) {
        val id = ctx.pathParam("id")

        TransactionManager.callInTransaction(daoManager.connectionSource) {
            daoManager.collectionDao.delete(id)
            daoManager.requestDao.deleteAllInCollection(id)
        }

        ctx.end().await()
    }

    suspend fun importOpenApiCollection(ctx: RoutingContext) {
        val basePath = ctx.queryParam("basePath").elementAtOrNull(0) ?: ""
        val userId = ctx.user().principal().getLong("id")
        val f = ctx.fileUploads().iterator().next()
        val openApi = OpenAPIV3Parser().read(f.uploadedFileName())

        val name = openApi.info.title ?: "OpenAPI"

        val collection = CollectionDb(name, userId)
        daoManager.collectionDao.create(collection)

        val requests = OpenApiService.createRequestsFromOpenApi(openApi, basePath, collection.id)
        requests.forEach { daoManager.requestDao.create(it) }

        val requestsJson = requests.map(RequestDb::toJson)
        val collectionJson = collection.toJson().put("requests", requestsJson)

        vertx.fileSystem().delete(f.uploadedFileName()).await()

        ctx.end(collectionJson.encode()).await()
    }
}
