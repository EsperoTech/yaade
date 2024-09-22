package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.RequestSender
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class InvokeRoute(private val daoManager: DaoManager, private val requestSender: RequestSender) {

    suspend fun invoke(ctx: RoutingContext) {
        val request = ctx.body().asJsonObject().getJsonObject("request")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No request provided")
        val collectionId = request.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
        val collection = daoManager.collectionDao.getById(collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for ID: $collectionId"
            )
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User is not logged in")
        if (!collection.canRead(user))
            throw ServerError(
                HttpResponseStatus.FORBIDDEN.code(),
                "User is not allowed to read this collection"
            )
        val envName: String? = ctx.body().asJsonObject().getString("envName")
        val data = request.getJsonObject("data") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No data provided"
        )

        val result = requestSender.send(data, collection, envName, user)
        ctx.end(result.encode()).coAwait()
    }

}
