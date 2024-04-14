package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
<<<<<<< HEAD
import com.espero.yaade.model.db.ConfigDb.Companion.HTTP_CLIENT_CONFIG
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.SecretInterpolator
=======
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.services.SecretInterpolator
import io.netty.handler.codec.http.HttpResponseStatus
>>>>>>> 25d821ded0e577bd4b13420310664e37a49d901e
import io.vertx.core.MultiMap
import io.vertx.core.Vertx
import io.vertx.core.buffer.Buffer
import io.vertx.core.http.HttpMethod
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions
<<<<<<< HEAD
import io.vertx.ext.web.client.WebClientSession
import io.vertx.kotlin.core.json.json
import io.vertx.kotlin.core.json.obj
import io.vertx.kotlin.coroutines.await
import org.apache.http.HttpStatus


class InvokeRoute(vertx: Vertx, private val daoManager: DaoManager) {
    private val vertx = vertx
=======
import io.vertx.kotlin.core.json.json
import io.vertx.kotlin.core.json.obj
import io.vertx.kotlin.coroutines.coAwait

class InvokeRoute(private val vertx: Vertx, private val daoManager: DaoManager) {

>>>>>>> 25d821ded0e577bd4b13420310664e37a49d901e
    private val interpolator = SecretInterpolator(daoManager)

    suspend fun invoke(ctx: RoutingContext) {
        val request = ctx.body().asJsonObject().getJsonObject("request")
<<<<<<< HEAD
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No request provided")
        val collectionId = request.getLong("collectionId")
            ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "No collectionId provided")
        val collection = daoManager.collectionDao.getById(collectionId)
            ?: throw ServerError(HttpStatus.SC_NOT_FOUND, "No collection found for ID: $collectionId")
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpStatus.SC_FORBIDDEN, "User is not logged in")
        if (!collection.canRead(user))
            throw ServerError(HttpStatus.SC_FORBIDDEN, "User is not allowed to read this collection")
        val envName: String? = ctx.body().asJsonObject().getString("envName")

        val result = send(request, collection, envName)
        ctx.end(result.encode()).await()
    }

    private suspend fun send(request: JsonObject, collection: CollectionDb, envName: String?): JsonObject {
=======
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

        val result = send(request, collection, envName)
        ctx.end(result.encode()).coAwait()
    }

    private suspend fun send(
        request: JsonObject,
        collection: CollectionDb,
        envName: String?
    ): JsonObject {
>>>>>>> 25d821ded0e577bd4b13420310664e37a49d901e
        val requestData = request.getJsonObject("data")
        val interpolated = if (envName != null)
            interpolator.interpolate(requestData, collection.id, envName)
        else
            request

        val method = HttpMethod.valueOf(interpolated.getString("method"))
        val interpolatedUri = interpolated.getString("uri")
        val url = url(interpolatedUri)
        val body: String? = interpolated.getString("body")

<<<<<<< HEAD
        val disableSslCheck = collection.jsonData()
          .getJsonObject("config")
          ?.getJsonObject("httpClient")
          ?.getBoolean("disableSslCheck") ?: false
        val httpClient = WebClient.create(vertx, WebClientOptions().setVerifyHost(!disableSslCheck))
=======
        val clientOptions =
            collection.jsonData().getJsonObject("settings")?.getJsonObject("webClientOptions")
                ?: JsonObject()
        val webClientOptions = WebClientOptions(clientOptions)
        val httpClient = WebClient.create(vertx, webClientOptions)
>>>>>>> 25d821ded0e577bd4b13420310664e37a49d901e

        val httpRequest = httpClient.requestAbs(method, url)

        interpolated.getJsonArray("headers")?.forEach { header ->
            when (header) {
                is JsonObject -> if (!header.getString("key").isNullOrEmpty())
                    httpRequest.putHeader(header.getString("key"), header.getString("value"))
            }
        }

        val result = JsonObject()
        val t = System.currentTimeMillis()
        try {
            val res = if (!body.isNullOrEmpty())
<<<<<<< HEAD
                httpRequest.sendBuffer(Buffer.buffer(body.toByteArray())).await()
            else
                httpRequest.send().await()
            result.put("body", res.bodyAsString() ?: "")
            result.put("status", res.statusCode())
            result.put("headers", jsonHeaders(res.headers()))
            val size = if (res.bodyAsString().isNullOrEmpty()) 0 else res.bodyAsString().toByteArray().size
            result.put("size", size)
        } catch (e: Exception) {
=======
                httpRequest.sendBuffer(Buffer.buffer(body.toByteArray())).coAwait()
            else
                httpRequest.send().coAwait()
            result.put("body", res.bodyAsString() ?: "")
            result.put("status", res.statusCode())
            result.put("headers", jsonHeaders(res.headers()))
            val size =
                if (res.bodyAsString().isNullOrEmpty()) 0 else res.bodyAsString().toByteArray().size
            result.put("size", size)
        } catch (e: Throwable) {
>>>>>>> 25d821ded0e577bd4b13420310664e37a49d901e
            result.put("error", e.message)
        }
        val duration = System.currentTimeMillis() - t
        result.put("time", duration)

        return result
    }

    private fun url(uri: String): String {
        return if (uri.startsWith("http"))
            uri
        else
            "http://$uri"
    }

    private fun jsonHeaders(headers: MultiMap): JsonArray {
        val result = JsonArray()
        headers.forEach {
            result.add(
                json {
                    obj(
                        "key" to it.key,
                        "value" to it.value
                    )
                }
            )
        }
        return result
    }

}
