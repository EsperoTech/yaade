package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.JobScriptDb
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.OpenApiService
import com.espero.yaade.services.PostmanParser
import com.j256.ormlite.misc.TransactionManager
import io.netty.handler.codec.http.HttpResponseStatus
import io.swagger.v3.parser.OpenAPIV3Parser
import io.vertx.core.Vertx
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class CollectionRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun getAllCollections(ctx: RoutingContext) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")
        val rawCollections = if (daoManager.userDao.isAdmin(userId))
            daoManager.collectionDao.getAll()
        else {
            daoManager.userDao.getById(userId)?.let { daoManager.collectionDao.getForUser(it) }
                ?: listOf()
        }

        val result = createCollectionsResponse(rawCollections)
        ctx.end(JsonArray(result).encode())
    }

    private fun createCollectionsResponse(rawCollections: List<CollectionDb>): ArrayList<JsonObject> {
        val collections = rawCollections.map {
            it.hideSecrets()
            val requests = daoManager.requestDao
                .getAllInCollection(it.id)
                .map(RequestDb::toJson)
                .sortedBy { el -> el.getJsonObject("data").getInteger("rank") ?: 0 }
            val scripts = daoManager.jobScriptDao
                .getAllInCollection(it.id)
                .map { script -> script.toJson() }
                .sortedBy { el -> el.getJsonObject("data").getInteger("rank") ?: 0 }
            it.toJson()
                .put("requests", requests)
                .put("scripts", scripts)
        }.sortedBy { it.getJsonObject("data").getInteger("rank") ?: 0 }

        val result = ArrayList<JsonObject>()

        for (collection in collections) {
            val parentId = collection.getJsonObject("data").getLong("parentId")
            if (parentId == null) {
                result.add(collection)
            } else {
                val parent = collections.find { it.getLong("id") == parentId }
                if (parent == null) {
                    // NOTE: we add orphaned collections to the root, to not make them invisible
                    // but this should never happen
                    result.add(collection)
                    continue
                }
                val children = parent.getJsonArray("children", JsonArray()).add(collection)
                parent.put("children", children)
            }
        }

        return result
    }

    private fun findCollection(
        collectionId: Long,
        collections: JsonArray,
    ): JsonObject? {
        for (c in collections) {
            val collection = c as JsonObject
            if (collection.getLong("id") == collectionId) {
                return collection
            }
            val children = collection.getJsonArray("children", JsonArray())
            for (child in children) {
                val result = findCollection(collectionId, children)
                if (result != null) {
                    return result
                }
            }
        }

        return null
    }

    suspend fun postCollection(ctx: RoutingContext) {
        val data = ctx.body().asJsonObject()
        val userId = ctx.user().principal().getLong("id")
        val newCollection = CollectionDb(data, userId)

        val parentId = newCollection.jsonData().getLong("parentId")
        if (parentId != null) {
            val parent = daoManager.collectionDao.getById(parentId)
                ?: throw RuntimeException("parent collection not found")
            assertUserCanReadCollection(ctx, parent)
        }

        daoManager.collectionDao.create(newCollection)

        val result = newCollection.toJson()
            .put("requests", JsonArray())
            .put("scripts", JsonArray())
            .encode()
        ctx.end(result)
    }

    suspend fun duplicateCollection(ctx: RoutingContext) {
        val collectionId =
            ctx.pathParam("id")?.toLong() ?: throw RuntimeException("Collection id not found")
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId) ?: throw RuntimeException("User not found")
        val collection = daoManager.collectionDao.getById(collectionId)

        if (collection == null || !collection.canRead(user)) {
            throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Collection not found")
        }

        val body = ctx.body().asJsonObject()
        val topLevelParentId = collection.jsonData().getLong("parentId") ?: null
        val name = body.getString("name")
        collection.patchData(JsonObject().put("name", name))

        val collections = daoManager
            .collectionDao.getAll()
        val collectionsToDuplicate = mutableListOf(collection)
        var parentIds = listOf(collection.id)
        // NOTE: we cap at 10 to prevent infinite loops
        for (i in 0..10) {
            val childCollections = collections.filter { c ->
                c.jsonData().getLong("parentId") in parentIds
            }
            if (childCollections.isEmpty()) {
                break
            }
            collectionsToDuplicate.addAll(childCollections)
            parentIds = childCollections.map { it.id }
        }

        val requests = mutableListOf<RequestDb>()
        val scripts = mutableListOf<JobScriptDb>()
        for (c in collectionsToDuplicate) {
            val reqs = daoManager.requestDao.getAllInCollection(c.id)
            val scs = daoManager.jobScriptDao.getAllInCollection(c.id)
            requests.addAll(reqs)
            scripts.addAll(scs)
        }

        val oldToNewIds = mutableMapOf<Long, Long>()

        TransactionManager.callInTransaction(daoManager.connectionSource) {
            collectionsToDuplicate.forEach {
                // NOTE: we can do this because the list is sorted by parents -> children
                val parentId = it.jsonData().getLong("parentId")
                if (parentId != null) {
                    val newParentId = oldToNewIds[parentId]
                    if (newParentId != null) {
                        it.patchData(JsonObject().put("parentId", newParentId))
                    } else {
                        if (parentId != topLevelParentId) {
                            // NOTE: this should never happen but we add this check to be safe
                            throw RuntimeException(
                                "Parent collection not found for id: $parentId"
                            )
                        }
                    }
                }
                val oldId = it.id
                daoManager.collectionDao.create(it)
                oldToNewIds[oldId] = it.id
                val rs = requests.filter { r -> r.collectionId == oldId }
                rs.forEach { r ->
                    r.collectionId = it.id
                    daoManager.requestDao.create(r)
                }
                scripts.filter { s -> s.collectionId == oldId }
                    .forEach { s ->
                        s.collectionId = it.id
                        daoManager.jobScriptDao.create(s)
                    }
            }
        }

        val result = createCollectionsResponse(collectionsToDuplicate)
        if (result.size != 1) {
            throw RuntimeException("Invalid state after duplication")
        }
        val newCollection = result[0]

        ctx.end(newCollection.encode())
    }

    suspend fun putCollection(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()

        val id = body.getLong("id") ?: throw RuntimeException("No id provided")
        val collection = daoManager.collectionDao.getById(id)
            ?: throw RuntimeException("Collection not found")
        assertUserCanReadCollection(ctx, collection)

        val newCollection = CollectionDb.fromUpdateRequest(body)
        daoManager.collectionDao.updateWithoutSecrets(newCollection)
        ctx.end()
    }

    suspend fun moveCollection(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val id = ctx.pathParam("id").toLong()
        val newParentId = body.getLong("newParentId")
        val collection = daoManager.collectionDao.getById(id)
            ?: throw RuntimeException("Collection not found")
        assertUserCanReadCollection(ctx, collection)

        if (newParentId != null) {
            val newParent = daoManager.collectionDao.getById(newParentId)
                ?: throw RuntimeException("Parent collection not found")
            assertUserCanReadCollection(ctx, newParent)
        }

        val oldParentId = collection.jsonData().getLong("parentId")

        val newChildren = daoManager.collectionDao
            .getAll()
            .filter { it.jsonData().getLong("parentId") == newParentId }
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
            .toMutableList()

        if (oldParentId == newParentId) {
            newChildren.removeIf { c -> c.id == id }
        } else {
            collection.patchData(JsonObject().put("parentId", newParentId))
            daoManager.collectionDao.update(collection)
            val oldChildren = daoManager.collectionDao
                .getAll()
                .filter {
                    it.jsonData().getLong("parentId") == collection.jsonData()
                        .getLong("parentId")
                }
                .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
                .toMutableList()
            oldChildren.removeIf { c -> c.id == id }
            oldChildren.forEachIndexed { index, collectionDb ->
                collectionDb.patchData(JsonObject().put("rank", index))
                daoManager.collectionDao.update(collectionDb)
            }
        }

        val newRank = body.getInteger("newRank") ?: 0
        newChildren.add(newRank, collection)
        newChildren.forEachIndexed { index, collectionDb ->
            collectionDb.patchData(JsonObject().put("rank", index))
            daoManager.collectionDao.update(collectionDb)
        }

        ctx.end()
    }

    suspend fun deleteCollection(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw RuntimeException("Collection not found")
        assertUserCanReadCollection(ctx, collection)

        val collections = daoManager
            .collectionDao.getAll()
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }

        val collectionsWithChildren = createCollectionsResponse(collections)
        val collectionToDelete = findCollection(id, JsonArray(collectionsWithChildren))
            ?: throw RuntimeException("Collection not found")

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
            deleteCollectionAndChildren(collectionToDelete)
        }

        ctx.end()
    }

    private fun deleteCollectionAndChildren(collection: JsonObject) {
        val children = collection.getJsonArray("children", JsonArray())
        for (child in children) {
            deleteCollectionAndChildren(child as JsonObject)
        }
        val id = collection.getLong("id")
        daoManager.collectionDao.delete(id)
        daoManager.requestDao.deleteAllInCollection(id)
        daoManager.jobScriptDao.deleteAllInCollection(id)
    }

    suspend fun importOpenApiCollection(ctx: RoutingContext) {
        val basePath = ctx.queryParam("basePath").elementAtOrNull(0) ?: ""
        val groups = ctx.queryParam("groups").elementAtOrNull(0) ?: ""
        val parentId = ctx.queryParam("parentId").elementAtOrNull(0)?.toLongOrNull()
        val userId = ctx.user().principal().getLong("id")
        val f = ctx.fileUploads().iterator().next()
        val openApi = OpenAPIV3Parser().read(f.uploadedFileName())

        val name = openApi.info.title ?: "OpenAPI"
        val description = openApi.info.description ?: ""
        val data = JsonObject()
            .put("name", name)
            .put("description", description)
            .put("groups", groups.split(","))

        if (parentId != null) {
            data.put("parentId", parentId)
        }
        val collection = CollectionDb(data, userId)
        collection.createEnv("default", null)
        daoManager.collectionDao.create(collection)

        val requests = OpenApiService.createRequestsFromOpenApi(openApi, basePath, collection)
        requests.forEach { daoManager.requestDao.create(it) }

        val requestsJson = requests.map(RequestDb::toJson)
        val collectionJson = collection.toJson().put("requests", requestsJson)

        vertx.fileSystem().delete(f.uploadedFileName()).coAwait()

        ctx.end(collectionJson.encode())
    }

    suspend fun importPostmanCollection(ctx: RoutingContext) {
        val groups = ctx.queryParam("groups").elementAtOrNull(0) ?: ""
        val parentId = ctx.queryParam("parentId").elementAtOrNull(0)?.toLongOrNull()
        val userId = ctx.user().principal().getLong("id")
        val f = ctx.fileUploads().iterator().next()

        val rawContent = vertx.fileSystem().readFile(f.uploadedFileName()).coAwait()
        val postmanCollection = rawContent.toJsonObject()
        val parser = PostmanParser(postmanCollection, daoManager)

        val collectionId = parser.parseCollection(userId, groups.split(","), parentId)
        val collections = daoManager.collectionDao.getAll()
        val collectionsWithChildren = createCollectionsResponse(collections)
        val newCollection =
            findCollection(collectionId, JsonArray(collectionsWithChildren))
                ?: throw RuntimeException("Collection not found")

        vertx.fileSystem().delete(f.uploadedFileName()).coAwait()

        ctx.end(newCollection.encode())
    }

    suspend fun createEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No collection found for id: $id"
            )

        assertUserCanReadCollection(ctx, collection)

        try {
            val name = ctx.pathParam("env")
            val body: JsonObject? = ctx.body().asJsonObject()
            collection.createEnv(name, body)
            daoManager.collectionDao.update(collection)
            ctx.end()
        } catch (e: RuntimeException) {
            throw ServerError(HttpResponseStatus.CONFLICT.code(), "Failed to create environment")
        }
    }

    suspend fun updateEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No collection found for id: $id"
            )

        assertUserCanReadCollection(ctx, collection)

        val env = ctx.body().asJsonObject()
        val name = ctx.pathParam("env")
        collection.updateEnv(name, env)
        daoManager.collectionDao.update(collection)
        ctx.end()
    }

    suspend fun deleteEnv(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No collection found for id: $id"
            )

        assertUserCanReadCollection(ctx, collection)

        val name = ctx.pathParam("env")
        collection.deleteEnv(name)
        daoManager.collectionDao.update(collection)
        ctx.end()
    }

    suspend fun setSecret(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No collection found for id: $id"
            )
        assertUserCanReadCollection(ctx, collection)

        val envName = ctx.pathParam("env")
        val key = ctx.pathParam("key")
        val value = ctx.body().asJsonObject().getString("value")
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No value for secret provided"
            )

        collection.setSecret(envName, key, value)
        daoManager.collectionDao.update(collection)
        ctx.end()
    }

    suspend fun deleteSecret(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val collection = daoManager.collectionDao.getById(id)
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No collection found for id: $id"
            )
        assertUserCanReadCollection(ctx, collection)

        val envName = ctx.pathParam("env")
        val key = ctx.pathParam("key")
        collection.deleteSecret(envName, key)
        daoManager.collectionDao.update(collection)
        ctx.end()
    }

    private fun assertUserCanReadCollection(ctx: RoutingContext, collection: CollectionDb?) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")

        val user = daoManager.userDao.getById(userId)
            ?: throw RuntimeException("No user found for id $userId")

        if (collection == null) {
            throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "Collection not found")
        }

        if (!collection.canRead(user)) {
            throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for id: ${collection.id}"
            )
        }
    }

}
