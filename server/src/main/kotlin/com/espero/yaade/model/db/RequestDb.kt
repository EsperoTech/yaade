package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.buffer.Buffer
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "requests")
class RequestDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField(index = true)
    var collectionId: Long = -1

    @DatabaseField
    lateinit var type: String

    @DatabaseField
    lateinit var version: String

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(collectionId: Long, name: String) {
        this.collectionId = collectionId
        this.type = "REST"
        this.version = "1.0.0"
        this.data = JsonObject()
            .put("name", name)
            .put("uri", "")
            .put("method", "GET")
            .put("headers", JsonArray())
            .put("body", "")
            .encode().toByteArray()
    }

    constructor(collectionId: Long, data: JsonObject) {
        this.collectionId = collectionId
        this.type = "REST"
        this.version = "1.0.0"
        this.data = data.encode().toByteArray()
    }

    constructor(id: Long, collectionId: Long, type: String, version: String, data: JsonObject) {
        this.id = id
        this.collectionId = collectionId
        this.type = type
        this.version = version
        this.data = data.encode().toByteArray()
    }

    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun patchData(data: JsonObject) {
        val newData = jsonData()
        data.forEach { entry ->
            newData.put(entry.key, entry.value)
        }
        setData(newData)
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("collectionId", collectionId)
            .put("type", type)
            .put("version", version)
            .put("data", JsonObject(Buffer.buffer(data)))
    }

    companion object {

        fun fromUpdateRequest(request: JsonObject): RequestDb {
            return RequestDb(
                id = request.getLong("id"),
                collectionId = request.getLong("collectionId"),
                type = request.getString("type"),
                version = request.getString("version"),
                data = request.getJsonObject("data")
            )
        }

        fun fromPostmanRequest(
            url: String,
            name: String,
            collectionId: Long,
            method: String,
            headers: JsonArray,
            body: String?
        ): RequestDb {
            val data = JsonObject()
                .put("name", name)
                .put("uri", url)
                .put("method", method)
                .put("headers", headers)
                .put("body", body)
            return RequestDb(collectionId, data)
        }
    }
}
