package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import io.vertx.core.Vertx
import io.vertx.core.eventbus.Message
import io.vertx.core.http.WebSocket
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.coroutines.CoroutineVerticle
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class WebsocketManager(private val vertx: Vertx, daoManager: DaoManager) :
    CoroutineVerticle() {

    private val websockets = ConcurrentHashMap<String, WebSocket>()
    private val secretInterpolator = SecretInterpolator(daoManager)

    public override suspend fun start() {
        vertx.eventBus().consumer("ws.connect", this::connect)
        vertx.eventBus().consumer("ws.write", this::handleWrite)
        vertx.eventBus().consumer("ws.disconnect", this::disconnect)
    }

    public override suspend fun stop() {
        websockets.forEach { (_, socket) -> socket.close() }
        websockets.clear()
    }

    private fun connect(msg: Message<JsonObject>) {
        val requestData = msg.body().getJsonObject("data")
        val envName = msg.body().getString("envName")
        val collectionId = requestData.getLong("collectionId")
        val interpolated = if (envName != null)
            secretInterpolator.interpolate(requestData, collectionId, envName)
        else
            requestData
        val host = msg.body().getString("host")
        val uri = msg.body().getString("uri")
        val port = msg.body().getInteger("port")
        vertx.createWebSocketClient().connect(port, host, uri).onSuccess {
            val socketId = UUID.randomUUID().toString()
            it.textMessageHandler { msg -> handleRead(msg, socketId) }
            websockets[socketId] = it
            msg.reply(
                JsonObject()
                    .put("status", "connected")
                    .put("socketId", socketId)
            )
        }.onFailure {
            msg.fail(500, it.message)
        }
    }

    private fun handleRead(msg: String, socketId: String) {
        vertx.eventBus().send("ws.read:$socketId", JsonObject(msg))
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
