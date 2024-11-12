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
        val type = body.getString("type")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No type provided")
        val newRequest = RequestDb(collectionId, type, body.getJsonObject("data"))

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
        }

        val oldCollectionId = request.collectionId

        val newRequests = daoManager.requestDao.getAllInCollection(newCollectionId)
            .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
            .toMutableList()

        if (oldCollectionId == newCollectionId) {
            newRequests.removeIf { c -> c.id == id }
        } else {
            request.collectionId = newCollectionId
            daoManager.requestDao.update(request)
            val oldRequests = daoManager.requestDao
                .getAllInCollection(oldCollectionId)
                .sortedBy { it.jsonData().getInteger("rank") ?: 0 }
                .toMutableList()
            oldRequests.removeIf { c -> c.id == id }
            oldRequests.forEachIndexed { index, r ->
                r.patchData(JsonObject().put("rank", index))
                daoManager.requestDao.update(r)
            }
        }

        val newRank = body.getInteger("newRank") ?: 0
        newRequests.add(newRank, request)
        newRequests.forEachIndexed { index, r ->
            r.patchData(JsonObject().put("rank", index))
            daoManager.requestDao.update(r)
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
