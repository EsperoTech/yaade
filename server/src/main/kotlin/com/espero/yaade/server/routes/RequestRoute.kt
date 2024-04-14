package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class RequestRoute(private val daoManager: DaoManager) {

    suspend fun postRequest(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val collectionId = body.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
        assertUserCanReadCollection(ctx, collectionId)
        val newRequest = if (body.containsKey("data"))
            RequestDb(collectionId, body.getJsonObject("data"))
        else
            RequestDb(collectionId, body.getString("name"))

        daoManager.requestDao.create(newRequest)

        ctx.end(newRequest.toJson().encode()).coAwait()
    }

    suspend fun putRequest(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val collectionId = body.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
        assertUserCanReadCollection(ctx, collectionId)
        val newRequest = RequestDb.fromUpdateRequest(ctx.body().asJsonObject())
        daoManager.requestDao.update(newRequest)
        ctx.end().coAwait()
    }

    suspend fun moveRequest(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()
        val id = ctx.pathParam("id").toLong()
        val newCollectionId = body.getLong("newCollectionId")
        val request = daoManager.requestDao.getById(id)
            ?: throw RuntimeException("Request not found")
        assertUserCanReadCollection(ctx, request.collectionId)
        
        if (newCollectionId != null) {
            assertUserCanReadCollection(ctx, newCollectionId)
            daoManager.collectionDao.getById(newCollectionId)
                ?: throw RuntimeException("Collection not found")
            request.collectionId = newCollectionId
            daoManager.requestDao.update(request)
        }

        val collectionId = request.collectionId
        assertUserCanReadCollection(ctx, collectionId)
        val requests = daoManager.requestDao
            .getAllInCollection(collectionId)
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
        val newRequests = requests.toMutableList()

        if (newCollectionId == null) {
            val oldRank = requests.indexOfFirst { it.id == id }
            if (oldRank == -1) {
                throw RuntimeException("Request not found in collection")
            }

            newRequests.removeAt(oldRank)
        }

        val newRank = if (newCollectionId == null) {
            body.getInteger("newRank")
        } else {
            requests.size
        } ?: throw RuntimeException("Invalid new rank")
        if (newRank < 0 || newRank > requests.size) {
            throw RuntimeException("Invalid new rank")
        }

        newRequests.add(newRank, request)
        newRequests.forEachIndexed { index, requestDb ->
            requestDb.patchData(JsonObject().put("rank", index))
            daoManager.requestDao.update(requestDb)
        }

        ctx.end().coAwait()
    }

    suspend fun deleteRequest(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val request =
            daoManager.requestDao.getById(id) ?: throw RuntimeException("Request not found")
        val collectionId = request.collectionId
        assertUserCanReadCollection(ctx, collectionId)

        val requests = daoManager.requestDao
            .getAllInCollection(collectionId)
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }

        val oldRank = requests.indexOfFirst { it.id == id }
        if (oldRank == -1) {
            throw RuntimeException("Request not found in collection")
        }

        val newRequests = requests.toMutableList()
        newRequests.removeAt(oldRank)
        newRequests.forEachIndexed { index, requestDb ->
            requestDb.jsonData().put("rank", index)
            daoManager.requestDao.update(requestDb)
        }

        daoManager.requestDao.delete(id)

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
