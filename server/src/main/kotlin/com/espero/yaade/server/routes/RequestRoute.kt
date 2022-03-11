package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.RequestDb
import io.vertx.ext.web.RoutingContext


class RequestRoute(private val daoManager: DaoManager) {

    fun postRequest(ctx: RoutingContext) {
        val newRequest = RequestDb(ctx.bodyAsJson)

        daoManager.requestDao.create(newRequest)

        ctx.end(newRequest.toJson().encode())
    }

    fun putRequest(ctx: RoutingContext) {
        val newRequest = RequestDb.fromUpdateRequest(ctx.bodyAsJson)
        daoManager.requestDao.update(newRequest)
        println(newRequest.toJson().encode())
        ctx.end()
    }

}
