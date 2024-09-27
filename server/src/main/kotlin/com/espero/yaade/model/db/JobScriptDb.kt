package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "jobscript")
class JobScriptDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    var collectionId: Long = -1

    @DatabaseField
    var ownerId: Long = -1

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(collectionId: Long, ownerId: Long, data: JsonObject) {
        this.collectionId = collectionId
        this.ownerId = ownerId
        this.data = data.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun setJsonData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("collectionId", collectionId)
            .put("ownerId", ownerId)
            .put("data", jsonData())
    }

    fun patchData(data: JsonObject) {
        val newData = jsonData()
        data.forEach { entry ->
            newData.put(entry.key, entry.value)
        }
        setJsonData(newData)
    }

    companion object {

        fun fromUpdateRequest(json: JsonObject, ownerId: Long): JobScriptDb {
            val id = json.getLong("id") ?: throw RuntimeException("No id provided")
            val collectionId = json.getLong("collectionId")
                ?: throw RuntimeException("No collectionId provided")
            val data = json.getJsonObject("data")
                ?: throw RuntimeException("No data provided")
            val res = JobScriptDb()
            res.id = id
            res.ownerId = ownerId
            res.collectionId = collectionId
            res.setJsonData(data)
            return res
        }
    }

}
