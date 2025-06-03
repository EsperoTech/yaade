package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.SecretInterpolator
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Future
import io.vertx.core.Vertx
import io.vertx.core.http.ServerWebSocket
import io.vertx.core.http.WebSocket
import io.vertx.core.http.WebSocketConnectOptions
import io.vertx.core.impl.logging.LoggerFactory
import io.vertx.core.json.JsonObject
import java.net.URI
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class WebsocketRoute(
    private val vertx: Vertx,
    private val daoManager: DaoManager,
) {

    private val log = LoggerFactory.getLogger(WebsocketRoute::class.java)

    private val websockets = ConcurrentHashMap<String, WebSocket>()
    private val secretInterpolator = SecretInterpolator(daoManager)

    private fun wsMessage(type: String, result: JsonObject): String {
        return JsonObject().put("type", type).put("result", result).encode()
    }

    fun handle(ws: ServerWebSocket, user: UserDb) {
        try {
            if (ws.path() == "/api/ws") {
                val wsId = UUID.randomUUID().toString()
                ws.accept()
                ws.closeHandler {
                    websockets[wsId]?.close()
                    websockets.remove(wsId)
                }
                ws.textMessageHandler { msg ->
                    val data = JsonObject(msg)
                    when (data.getString("type")) {
                        "ws-connect" -> connect(data.getJsonObject("request"), user, ws)
                            .onSuccess {
                                websockets[wsId] = it
                                it.closeHandler {
                                    if (websockets.containsKey(wsId)) {
                                        ws.writeTextMessage(
                                            wsMessage(
                                                "ws-close",
                                                JsonObject()
                                                    .put("status", "error")
                                                    .put("err", "WebSocket closed unexpectedly")
                                                    .put("wsId", wsId)
                                            )
                                        )
                                        websockets.remove(wsId)
                                    }
                                }
                                it.textMessageHandler { msg ->
                                    ws.writeTextMessage(
                                        wsMessage(
                                            "ws-read", JsonObject()
                                                .put("wsId", wsId)
                                                .put("message", msg)
                                        )
                                    )
                                }
                                ws.writeTextMessage(
                                    wsMessage(
                                        "ws-connect-result",
                                        JsonObject()
                                            .put("status", "success")
                                            .put("metaData", data.getJsonObject("metaData"))
                                            .put("wsId", wsId)
                                    )
                                )
                            }.onFailure {
                                log.info("Failed to connect websocket: ${it.message}")
                                ws.writeTextMessage(
                                    wsMessage(
                                        "ws-connect-result",
                                        JsonObject()
                                            .put("status", "error")
                                            .put("err", "Websocket connection failed")
                                            .put("metaData", data.getJsonObject("metaData"))
                                    )
                                )
                                websockets.remove(wsId)
                                ws.close()
                            }

                        "ws-write" -> {
                            handleWrite(
                                wsId,
                                data.getJsonObject("data", JsonObject()).getString("message")
                            ).onSuccess {
                                ws.writeTextMessage(
                                    wsMessage(
                                        "ws-write-result", JsonObject()
                                            .put("status", "success")
                                            .put("wsId", wsId)
                                            .put("metaData", data.getJsonObject("metaData"))
                                    )
                                )
                            }.onFailure {
                                wsMessage(
                                    "ws-write-result", JsonObject()
                                        .put("status", "error")
                                        .put("err", it.message)
                                        .put("wsId", wsId)
                                        .put("metaData", data.getJsonObject("metaData"))
                                )
                            }
                        }

                        "ws-disconnect" -> disconnect(wsId)
                            .onSuccess {
                                ws.writeTextMessage(
                                    wsMessage(
                                        "ws-disconnect-result", JsonObject()
                                            .put("status", "success")
                                            .put("wsId", wsId)
                                            .put("metaData", data.getJsonObject("metaData"))
                                    )
                                )
                            }
                            .onFailure {
                                wsMessage(
                                    "ws-disconnect-result", JsonObject()
                                        .put("status", "error")
                                        .put("err", it.message)
                                        .put("wsId", wsId)
                                        .put("metaData", data.getJsonObject("metaData"))
                                )
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

    private fun connect(
        request: JsonObject,
        user: UserDb,
        ws: ServerWebSocket,
    ): Future<WebSocket> {
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
        val requestData = request.getJsonObject("data") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No data provided"
        )
        val interpolated = if (envName != null)
            secretInterpolator.interpolate(requestData, collectionId, envName)
        else
            requestData
        val uri = URI(interpolated.getString("uri"))
        val pathAndQuery = uri.rawPath + if (uri.rawQuery != null) "?" + uri.rawQuery else ""

        val options = WebSocketConnectOptions()
            .setHost(uri.host)
            .setURI(pathAndQuery)
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
        interpolated.getJsonArray("headers")?.forEach { header ->
            if (header is JsonObject) {
                options.addHeader(header.getString("key"), header.getString("value"))
            }
        }
        return vertx.createWebSocketClient().connect(options)
    }

    private fun handleWrite(wsId: String, data: String): Future<Void> {
        if (!websockets.containsKey(wsId)) {
            return Future.failedFuture("WebSocket not found")
        }
        if (websockets[wsId]!!.isClosed) {
            return Future.failedFuture("WebSocket is closed")
        }
        return websockets[wsId]!!.writeTextMessage(data)
    }

    private fun disconnect(wsId: String): Future<Void> {
        if (!websockets.containsKey(wsId)) {
            return Future.failedFuture("WebSocket not found")
        }
        websockets.remove(wsId)?.close()
        return Future.succeededFuture()
    }
}
