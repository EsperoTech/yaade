package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.RequestDb
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await


class RequestRoute(private val daoManager: DaoManager) {

    suspend fun postRequest(ctx: RoutingContext) {
        val body = ctx.bodyAsJson
        val newRequest = if (body.containsKey("data"))
            RequestDb(body.getLong("collectionId"), body.getJsonObject("data"))
        else
            RequestDb(body.getLong("collectionId"), body.getString("name"))

        daoManager.requestDao.create(newRequest)

        ctx.end(newRequest.toJson().encode()).await()
    }

    suspend fun putRequest(ctx: RoutingContext) {
        val newRequest = RequestDb.fromUpdateRequest(ctx.bodyAsJson)
        daoManager.requestDao.update(newRequest)
        ctx.end().await()
    }

    suspend fun deleteRequest(ctx: RoutingContext) {
        val id = ctx.pathParam("id")
        daoManager.requestDao.delete(id)
        ctx.end().await()
    }

}
