package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.postman.collection.Collection
import com.postman.collection.Folder
import com.postman.collection.Request
import com.postman.collection.enumRequestBodyMode
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

fun String.envReplace(): String {
    return this
        .replace("{{", "\${")
        .replace("}}", "}")
}

class PostmanParser(val collection: JsonObject, val daoManager: DaoManager) {

    fun parseCollection(userId: Long, groups: List<String>, parentId: Long?): Long {
        val pmc: Collection = Collection.pmcFactory(collection.encode())
        val data = JsonObject()
            .put("name", pmc.name ?: "Postman")
            .put("groups", groups)
            .put("description", pmc.description ?: "")
        if (parentId != null) {
            data.put("parentId", parentId)
        }

        val newCollection = CollectionDb(data, userId)

        daoManager.transaction {
            val createEnvReq = JsonObject()
            pmc.variables?.forEach {
                val key = it.key ?: ""
                val value = it.value ?: ""
                createEnvReq.put(key, value)
            }
            newCollection.createEnv("default", JsonObject().put("data", createEnvReq))

            daoManager.collectionDao.create(newCollection)

            val items = pmc.items ?: listOf()

            for (item in items) {
                when (item) {
                    is Folder -> parseFolder(newCollection.id, userId, groups, item)
                    is Request -> parseRequest(newCollection.id, item)
                }
            }
        }

        return newCollection.id
    }

    private fun parseFolder(parentId: Long, userId: Long, groups: List<String>, folder: Folder) {
        val data = JsonObject()
            .put("name", folder.name ?: "Postman")
            .put("groups", groups)
            .put("parentId", parentId)
            .put("description", folder.description ?: "")

        val newCollection = CollectionDb(data, userId)

        newCollection.createEnv("default", JsonObject().put("data", JsonObject()))

        daoManager.collectionDao.create(newCollection)

        val items = folder.items ?: listOf()

        for (item in items) {
            when (item) {
                is Folder -> parseFolder(newCollection.id, parentId, groups, item)
                is Request -> parseRequest(newCollection.id, item)
            }
        }
    }

    private fun parseRequest(collectionId: Long, request: Request) {
        if (request.requestBody == null) {
            return
        }
        val url = request.requestBody.url?.raw?.envReplace() ?: ""
        val headers = JsonArray()
        request.requestBody.header?.forEach {
            headers.add(
                JsonObject().put("key", it.key?.envReplace() ?: "")
                    .put("value", it.value?.envReplace() ?: "")
            )
        }
        var rawBody: String? = null
        val urlEncodedBody = JsonArray()
        when (request.requestBody.body?.mode) {
            enumRequestBodyMode.RAW -> rawBody = request.requestBody.body?.raw?.envReplace() ?: ""
            enumRequestBodyMode.URLENCODED -> {
                request.requestBody?.body?.formdata?.forEach {
                    urlEncodedBody.add(
                        JsonObject().put("key", it.key ?: "")
                            .put("value", it.value?.envReplace() ?: "")
                    )
                }
            }

            else -> {}
        }
        var contentType: String? = null
        if (rawBody != null) {
            contentType = "application/json"
        } else if (urlEncodedBody.size() > 0) {
            contentType = "application/x-www-form-urlencoded"
        }
        val newRequest = RequestDb.fromPostmanRequest(
            url = url,
            name = request.name ?: "Request",
            collectionId = collectionId,
            method = request.requestBody.method?.name ?: "GET",
            headers = headers,
            contentType = contentType,
            body = rawBody,
            urlEncodedBody = urlEncodedBody
        )

        daoManager.requestDao.create(newRequest)
    }
}
