package com.espero.yaade.services

import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

fun String.envReplace(): String {
    return this
        .replace("{{", "\${")
        .replace("}}", "}")
}

class PostmanParser(val collection: JsonObject) {
    fun parseCollection(userId: Long, groups: List<String>): CollectionDb {
        val name = collection.getJsonObject("info")?.getString("name") ?: "Postman"
        val data = JsonObject().put("name", name).put("groups", groups)
        val newCollection = CollectionDb(data, userId)

        val variables = collection.getJsonArray("variable") ?: JsonArray()
        val createEnvReq = JsonObject()
        variables.forEach {
            val variable = it as JsonObject
            val key = variable.getString("key") ?: ""
            val value = variable.getString("value") ?: ""
            createEnvReq.put(key, value)
        }
        newCollection.createEnv("default", JsonObject().put("data", createEnvReq))

        return newCollection
    }

    fun parseRequests(collectionId: Long): List<RequestDb> {
        val newRequests = mutableListOf<RequestDb>()
        val requests = collection.getJsonArray("item")
        for (req in requests) {
            val request = req as JsonObject
            val rawUrl = request.getJsonObject("request")?.getValue("url")
            var url = ""
            when (rawUrl) {
                is String -> url = rawUrl
                is JsonObject -> url = rawUrl.getString("raw") ?: ""
            }
            val postmanHeaders = request.getJsonObject("request").getJsonArray("header")
            val headers = JsonArray()
            postmanHeaders.forEach {
                val header = it as JsonObject
                val k = header.getString("key")?.envReplace() ?: ""
                val v = header.getString("value")?.envReplace() ?: ""
                headers.add(JsonObject().put("key", k).put("value", v))
            }
            val newRequest = RequestDb.fromPostmanRequest(
                url = url,
                name = request.getString("name") ?: "Request",
                collectionId = collectionId,
                method = request.getJsonObject("request")?.getString("method") ?: "GET",
                headers = headers,
                body = request.getJsonObject("request")?.getJsonObject("body")?.getString("raw")?.envReplace()
            )
            newRequests.add(newRequest)
        }
        return newRequests
    }
}
