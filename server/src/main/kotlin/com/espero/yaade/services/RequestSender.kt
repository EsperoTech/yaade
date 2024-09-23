package com.espero.yaade.services

import com.espero.yaade.FILE_STORAGE_PATH
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import io.vertx.core.MultiMap
import io.vertx.core.Vertx
import io.vertx.core.buffer.Buffer
import io.vertx.core.http.HttpMethod
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions
import io.vertx.ext.web.multipart.MultipartForm
import io.vertx.kotlin.core.json.json
import io.vertx.kotlin.core.json.obj
import io.vertx.kotlin.coroutines.coAwait
import io.vertx.kotlin.coroutines.dispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.net.URLEncoder
import java.nio.file.Paths
import kotlin.coroutines.CoroutineContext

class RequestSender(private val vertx: Vertx, private val daoManager: DaoManager) : CoroutineScope {

    private val secretInterpolator = SecretInterpolator(daoManager)
    override val coroutineContext: CoroutineContext by lazy { vertx.dispatcher() + SupervisorJob() }

    init {
        vertx.eventBus().consumer<JsonObject>("request.send") { msg ->
            launch {
                try {
                    val requestData = msg.body().getJsonObject("data")
                    val collectionId = msg.body().getLong("collectionId")
                    val envName = msg.body().getString("envName")
                    val collection = daoManager.collectionDao.getById(collectionId)
                        ?: throw RuntimeException("Collection not found")
                    val res = send(requestData, collection, envName, null)
                    msg.reply(res)
                } catch (e: Throwable) {
                    msg.fail(500, e.message)
                }
            }

        }
    }

    suspend fun send(
        requestData: JsonObject,
        collection: CollectionDb,
        envName: String?,
        user: UserDb?
    ): JsonObject {
        val interpolated = if (envName != null)
            secretInterpolator.interpolate(requestData, collection.id, envName)
        else
            requestData

        val method = HttpMethod.valueOf(interpolated.getString("method"))
        val interpolatedUri = interpolated.getString("uri")
        val url = url(interpolatedUri)

        val clientOptions =
            collection.jsonData().getJsonObject("settings")?.getJsonObject("webClientOptions")
                ?: JsonObject()
        val webClientOptions = WebClientOptions(clientOptions)

        if (url.startsWith("https") && user != null) {
            // TODO: improve performance by caching certificates
            val certificates = daoManager.certificatesDao.getAll()
            for (cert in certificates) {
                if (cert.canRead(user) && cert.doesHostMatch(url)) {
                    cert.mutateWebClientOptions(webClientOptions)
                    break
                }
            }
        }
        val httpClient = WebClient.create(vertx, webClientOptions)

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
            val res = when (interpolated.getString("contentType", "")) {
                "multipart/form-data" -> {
                    val body = buildFormdataBody(interpolated.getJsonArray("formDataBody"))
                    httpRequest.sendMultipartForm(body).coAwait()
                }

                "application/x-www-form-urlencoded" -> {
                    val body = buildFormUrlencodedBody(interpolated)
                    httpRequest.sendBuffer(Buffer.buffer(body)).coAwait()
                }

                else -> {
                    val body = interpolated.getString("body")
                    if (!body.isNullOrEmpty())
                        httpRequest.sendBuffer(Buffer.buffer(body.toByteArray())).coAwait()
                    else
                        httpRequest.send().coAwait()
                }
            }
            result.put("body", res.bodyAsString() ?: "")
            result.put("status", res.statusCode())
            result.put("headers", jsonHeaders(res.headers()))
            val size =
                if (res.bodyAsString().isNullOrEmpty()) 0 else res.bodyAsString().toByteArray().size
            result.put("size", size)
        } catch (e: Throwable) {
            result.put("error", e.message)
        }
        val duration = System.currentTimeMillis() - t
        result.put("time", duration)

        return result
    }

    private fun buildFormUrlencodedBody(request: JsonObject): String {
        if (request.getJsonArray("formDataBody") == null) {
            return request.getString("body", "")
        }
        return request.getJsonArray("formDataBody", JsonArray()).map { it as JsonObject }
            .filter { it.getBoolean("enabled", true) }
            .joinToString("&") {
                val key = it.getString("key", "not-found")
                val value = it.getString("value", "")
                "${URLEncoder.encode(key, "UTF-8")}=${URLEncoder.encode(value, "UTF-8")}"
            }
    }

    private fun buildFormdataBody(body: JsonArray?): MultipartForm {
        val result = MultipartForm.create()
        if (body == null) {
            return result
        }
        for (it in body) {
            val entry = it as JsonObject
            val enabled = entry.getBoolean("enabled", true)
            if (!enabled) {
                continue
            }
            val key = entry.getString("key", "not-found")
            when (entry.getString("type", "kv")) {
                "kv" -> {
                    val value = entry.getString("value", "")
                    result.attribute(key, value)
                }

                "file" -> {
                    val file = entry.getJsonObject("file") ?: continue
                    val fileId = file.getString("id") ?: continue
                    val filename = file.getString("name") ?: "unknown"
                    val filePath = Paths.get(FILE_STORAGE_PATH, fileId)
                    result.binaryFileUpload(
                        key,
                        filename,
                        filePath.toString(),
                        "application/octet-stream"
                    )
                }
            }
        }
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
