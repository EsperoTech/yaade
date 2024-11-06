package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.errors.ServerError
import io.vertx.core.Vertx
import io.vertx.core.http.ServerWebSocket
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.Session
import io.vertx.ext.web.handler.SessionHandler.DEFAULT_SESSION_COOKIE_NAME
import io.vertx.ext.web.handler.impl.SessionHandlerImpl.SESSION_USER_HOLDER_KEY
import io.vertx.ext.web.handler.impl.UserHolder
import io.vertx.ext.web.sstore.SessionStore
import io.vertx.kotlin.coroutines.coAwait

class WebsocketRoute(
    private val vertx: Vertx,
    private val daoManager: DaoManager,
    private val sessionStore: SessionStore
) {

    suspend fun handle(ws: ServerWebSocket) {
        try {
            val rawCookies =
                ws.headers()["cookie"]?.split(";") ?: throw ServerError(401, "Not authenticated")
            val sessionCookie =
                rawCookies.find { it.contains("$DEFAULT_SESSION_COOKIE_NAME=") }
                    ?.substringAfter("=")
                    ?: throw ServerError(401, "Not authenticated")
            var session: Session? = null
            try {
                session = sessionStore.get(sessionCookie).coAwait()
            } catch (e: Throwable) {
                println("Error: ${e.message}")
            }
            println(session)
            val userHolder = session?.get(SESSION_USER_HOLDER_KEY) as UserHolder
            val user = userHolder.user()

            if (ws.path() == "/api/ws") {
                ws.accept()
                ws.textMessageHandler { msg ->
                    val data = JsonObject(msg)
                    when (data.getString("type")) {
                        "connect" -> connect(data.getJsonObject("request"))
                        "write" -> {
                            vertx.eventBus().send("ws.write", data.getJsonObject("message"))
                        }
                    }
                }
            } else {
                ws.reject()
            }
        } catch (e: Throwable) {
            println("Error: ${e.message}")
            ws.reject()
        }
    }

    fun connect(request: JsonObject) {
        /*if (request.getString("type") != "WS") {
            throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "Request type must be WS")
        }
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

        val result = requestSender.connect(data, collection, envName, user)
        ctx.end(result.encode()).coAwait()*/
    }
}
