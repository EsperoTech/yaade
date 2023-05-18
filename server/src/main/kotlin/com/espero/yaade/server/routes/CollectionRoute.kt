package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.OpenApiService
import com.espero.yaade.services.PostmanParser
import com.j256.ormlite.misc.TransactionManager
import io.swagger.v3.parser.OpenAPIV3Parser
import io.vertx.core.Vertx
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.validation.RequestParameters
import io.vertx.ext.web.validation.ValidationHandler
import io.vertx.kotlin.coroutines.await
import org.apache.http.HttpStatus


class CollectionRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun getAllCollections(ctx: RoutingContext) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")
        val collections = if (daoManager.userDao.isAdmin(userId))
            daoManager.collectionDao.getAll()
        else {
            daoManager.userDao.getById(userId)?.let { daoManager.collectionDao.getForUser(it) } ?: listOf()
        }

        val result = collections.map {
            val requests = daoManager.requestDao
                .getAllInCollection(it.id)
                .map(RequestDb::toJson)
                .sortedBy { el -> el.getJsonObject("data").getInteger("rank") ?: 0 }
            it.hideSecrets()
            it.toJson().put("requests", requests)
        }.sortedBy { it.getJsonObject("data").getInteger("rank") ?: 0 }

        ctx.end(JsonArray(result).encode()).await()
    }

    suspend fun postCollection(ctx: RoutingContext) {
        val data = ctx.body().asJsonObject()
        val name = data.getString("name")
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId) ?: throw RuntimeException("User not found")
        val existingCollections = daoManager.collectionDao.getByUserAndName(user, name)
        if (existingCollections.isNotEmpty()) {
            throw ServerError(HttpStatus.SC_CONFLICT, "A collection with this name already exists: $name")
        }
        val newCollection = CollectionDb(data, userId)

        daoManager.collectionDao.create(newCollection)

        val result = newCollection.toJson().put("requests", JsonArray()).encode()
        ctx.end(result).await()
    }

    suspend fun putCollection(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val newCollection = CollectionDb.fromUpdateRequest(body)
        daoManager.collectionDao.updateWithoutSecrets(newCollection)
        ctx.end().await()
    }

    suspend fun moveCollection(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val id = ctx.pathParam("id").toLong()
        val newRank = body.getInteger("newRank") ?: throw RuntimeException("Invalid new rank")
        val collection = daoManager.collectionDao.getById(id)
            ?: throw RuntimeException("Collection not found")
        val collections = daoManager.collectionDao
            .getAll()
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }

        val oldRank = collections.indexOfFirst { it.id == id }
        if (oldRank == -1) {
            throw RuntimeException("Collection not found")
        }
        if (newRank < 0 || newRank >= collections.size) {
            throw RuntimeException("Invalid new rank")
        }

        val newCollections = collections.toMutableList()
        newCollections.removeAt(oldRank)
        newCollections.add(newRank, collection)
        newCollections.forEachIndexed { index, collectionDb ->
            collectionDb.patchData(JsonObject().put("rank", index))
            daoManager.collectionDao.update(collectionDb)
        }

        ctx.end().await()
    }

    suspend fun deleteCollection(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()

        val collections = daoManager
            .collectionDao.getAll()
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }

        val oldRank = collections.indexOfFirst { it.id == id }
        if (oldRank == -1) {
            throw RuntimeException("Collection not found")
        }
        val newCollections = collections.toMutableList()
        newCollections.removeAt(oldRank)
        newCollections.forEachIndexed { index, collectionDb ->
            collectionDb.jsonData().put("rank", index)
            daoManager.collectionDao.update(collectionDb)
        }

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
        collection.createEnv("default", null)
        daoManager.collectionDao.create(collection)

        val requests = OpenApiService.createRequestsFromOpenApi(openApi, basePath, collection)
        requests.forEach { daoManager.requestDao.create(it) }

        val requestsJson = requests.map(RequestDb::toJson)
        val collectionJson = collection.toJson().put("requests", requestsJson)

        vertx.fileSystem().delete(f.uploadedFileName()).await()

        ctx.end(collectionJson.encode()).await()
    }

    suspend fun importPostmanCollection(ctx: RoutingContext) {
        val groups = ctx.queryParam("groups").elementAtOrNull(0) ?: ""
        val userId = ctx.user().principal().getLong("id")
        val f = ctx.fileUploads().iterator().next()

        val rawContent = vertx.fileSystem().readFile(f.uploadedFileName()).await()
        val postmanCollection = rawContent.toJsonObject()
        val parser = PostmanParser(postmanCollection)

        val collection = parser.parseCollection(userId, groups.split(","))
        daoManager.collectionDao.create(collection)
        val requests = parser.parseRequests(collection.id)
        requests.forEach { daoManager.requestDao.create(it) }

        val requestsJson = requests.map(RequestDb::toJson)
        val collectionJson = collection.toJson().put("requests", requestsJson)

        vertx.fileSystem().delete(f.uploadedFileName()).await()

        ctx.end(collectionJson.encode()).await()
    }

    private fun assertUserCanReadCollection(ctx: RoutingContext, collection: CollectionDb?) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")

        val user = daoManager.userDao.getById(userId) ?: throw RuntimeException("No user found for id $userId")

        if (collection == null) {
            throw ServerError(HttpStatus.SC_BAD_REQUEST, "Collection cannot be null")
        }

        if (!collection.canRead(user)) {
            throw ServerError(HttpStatus.SC_FORBIDDEN, "User ${user.username} is not allowed to read this collection")
        }
    }

    suspend fun createEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No collection found for id: $id")

        assertUserCanReadCollection(ctx, collection)

        try {
            val name = ctx.pathParam("env")
            val body: JsonObject? = ctx.body().asJsonObject()
            collection.createEnv(name, body)
            daoManager.collectionDao.update(collection)
            ctx.end().await()
        } catch (e: RuntimeException) {
            throw ServerError(HttpStatus.SC_CONFLICT, "Failed to create environment")
        }
    }

    suspend fun updateEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No collection found for id: $id")

        assertUserCanReadCollection(ctx, collection)

        val env = ctx.body().asJsonObject()
        val name = ctx.pathParam("env")
        collection.updateEnv(name, env)
        daoManager.collectionDao.update(collection)
        ctx.end().await()
    }

    suspend fun deleteEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No collection found for id: $id")

        assertUserCanReadCollection(ctx, collection)

        val name = ctx.pathParam("env")
        collection.deleteEnv(name)
        daoManager.collectionDao.update(collection)
        ctx.end().await()
    }

    suspend fun setSecret(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No collection found for id: $id")
        assertUserCanReadCollection(ctx, collection)

        val envName = ctx.pathParam("env")
        val key = ctx.pathParam("key")
        val value = ctx.body().asJsonObject().getString("value")
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No value for secret provided")

        collection.setSecret(envName, key, value)
        daoManager.collectionDao.update(collection)
        ctx.end().await()
    }
    suspend fun deleteSecret(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No collection found for id: $id")
        assertUserCanReadCollection(ctx, collection)

        val envName = ctx.pathParam("env")
        val key = ctx.pathParam("key")
        collection.deleteSecret(envName, key)
        daoManager.collectionDao.update(collection)
        ctx.end().await()
    }

}
