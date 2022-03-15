package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.RequestDb
import io.vertx.ext.web.RoutingContext


class RequestRoute(private val daoManager: DaoManager) {

    fun postRequest(ctx: RoutingContext) {
        val body = ctx.bodyAsJson
        val newRequest = if (body.containsKey("data"))
            RequestDb(body.getLong("collectionId"), body.getJsonObject("data"))
        else
            RequestDb(body.getLong("collectionId"), body.getString("name"))

        daoManager.requestDao.create(newRequest)

        ctx.end(newRequest.toJson().encode())
    }

    fun putRequest(ctx: RoutingContext) {
        try {
            val newRequest = RequestDb.fromUpdateRequest(ctx.bodyAsJson)
            daoManager.requestDao.update(newRequest)
            ctx.end()
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun deleteRequest(ctx: RoutingContext) {
        val id = ctx.pathParam("id")
        daoManager.requestDao.delete(id)
        ctx.end()
    }

}
