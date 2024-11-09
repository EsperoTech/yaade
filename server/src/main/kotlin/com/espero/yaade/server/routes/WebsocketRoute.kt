package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.SecretInterpolator
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Future
import io.vertx.core.Vertx
import io.vertx.core.eventbus.Message
import io.vertx.core.http.ServerWebSocket
import io.vertx.core.http.WebSocket
import io.vertx.core.http.WebSocketConnectOptions
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.sstore.SessionStore
import java.net.URI
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class WebsocketRoute(
    private val vertx: Vertx,
    private val daoManager: DaoManager,
    private val sessionStore: SessionStore
) {

    private val websockets = ConcurrentHashMap<String, WebSocket>()
    private val secretInterpolator = SecretInterpolator(daoManager)

    fun handle(ws: ServerWebSocket, user: UserDb) {
        try {
            if (ws.path() == "/api/ws") {
                val wsId = UUID.randomUUID().toString()
                ws.accept()
                ws.textMessageHandler { msg ->
                    val data = JsonObject(msg)
                    when (data.getString("type")) {
                        "ws-connect" -> connect(data.getJsonObject("request"), user, ws, wsId)
                            .onSuccess {
                                ws.writeTextMessage(it.body().encode())
                            }

                        "ws-write" -> {
                            vertx.eventBus().send("ws.write", data.getJsonObject("message"))
                        }
                    }
                }
                vertx.eventBus().consumer("ws.read:$wsId") { msg: Message<String> ->
                    ws.writeTextMessage(msg.body())
                }
            } else {
                ws.reject()
            }
        } catch (e: Throwable) {
            println("Error: ${e.message}")
            ws.reject()
        }
    }

    private fun connect(
        request: JsonObject,
        user: UserDb,
        ws: ServerWebSocket,
        wsId: String
    ): Future<Message<JsonObject>> {
        if (request.getString("type") != "WS") {
            throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "Request type must be WS")
        }
        val collectionId = request.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
        val collection = daoManager.collectionDao.getById(collectionId)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No collection found for ID: $collectionId"
            )
        if (!collection.canRead(user)) {
            ws.close()
            return Future.failedFuture(
                ServerError(
                    HttpResponseStatus.FORBIDDEN.code(),
                    "Forbidden"
                )
            )
        }
        val envName: String? = request.getString("envName")
        val data = request.getJsonObject("data") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No data provided"
        )

        return vertx.eventBus()
            .request(
                "ws.connect",
                JsonObject().put("data", data).put("envName", envName).put("wsId", wsId)
            )
    }

    private fun connect(msg: Message<JsonObject>) {
        try {
            val wsId = msg.body().getString("wsId") ?: throw Exception("wsId is required")
            val requestData = msg.body().getJsonObject("data")
            val envName = msg.body().getString("envName")
            val collectionId = requestData.getLong("collectionId")
            val interpolated = if (envName != null)
                secretInterpolator.interpolate(requestData, collectionId, envName)
            else
                requestData
            val uri = URI(requestData.getString("uri"))
            val options = WebSocketConnectOptions()
                .setHost(uri.host)
                .setURI(uri.path)
            if (uri.scheme == "wss") {
                options.setSsl(true)
                if (uri.port == -1) {
                    options.setPort(443)
                } else {
                    options.setPort(uri.port)
                }
            } else {
                if (uri.port == -1) {
                    options.setPort(80)
                } else {
                    options.setPort(uri.port)
                }
            }
            vertx.createWebSocketClient().connect(options).onSuccess {
                it.textMessageHandler { msg -> handleRead(msg, wsId) }
                websockets[wsId] = it
                msg.reply(
                    JsonObject()
                        .put("type", "ws-connected")
                        .put("wsId", wsId)
                )
            }.onFailure {
                msg.fail(500, it.message)
            }
        } catch (e: Throwable) {
            msg.fail(500, e.message)
        }

    }

    private fun handleRead(msg: String, wsId: String) {
        vertx.eventBus().send("ws.read:$wsId", msg)
    }

    private fun handleWrite(msg: Message<JsonObject>) {
        val socketId = msg.body().getString("socketId")
        val data = msg.body().getString("data")
        if (!websockets.containsKey(socketId)) {
            msg.fail(500, "Socket not found")
            return
        }
        websockets[socketId]!!.writeTextMessage(data).onSuccess {
            msg.reply(JsonObject().put("status", "sent"))
        }.onFailure {
            msg.fail(500, it.message)
        }
    }

    private fun disconnect(msg: Message<JsonObject>) {
        val socketId = msg.body().getString("socketId")
        if (!websockets.containsKey(socketId)) {
            msg.fail(500, "Socket not found")
            return
        }
        websockets[socketId]!!.close()
        websockets.remove(socketId)
        msg.reply(JsonObject().put("status", "disconnected"))
    }
}
