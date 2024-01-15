package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.RequestDb
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class RequestRoute(private val daoManager: DaoManager) {

    suspend fun postRequest(ctx: RoutingContext) {
        // TODO: can i add requests to collection that i cannot see? also edit?
        val body = ctx.body().asJsonObject()
        val newRequest = if (body.containsKey("data"))
            RequestDb(body.getLong("collectionId"), body.getJsonObject("data"))
        else
            RequestDb(body.getLong("collectionId"), body.getString("name"))

        daoManager.requestDao.create(newRequest)

        ctx.end(newRequest.toJson().encode()).coAwait()
    }

    suspend fun putRequest(ctx: RoutingContext) {
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

        if (newCollectionId != null) {
            daoManager.collectionDao.getById(newCollectionId)
                ?: throw RuntimeException("Collection not found")
            request.collectionId = newCollectionId
            daoManager.requestDao.update(request)
        }

        val collectionId = request.collectionId
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
}
