package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "jobscript")
class CronScriptDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    var collectionId: Long = -1

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(collectionId: Long, name: String) {
        this.collectionId = collectionId
        this.data = JsonObject()
            .put("name", name)
            .put("script", "")
            .put("enabled", false)
            .encode().toByteArray()
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
            .put("data", jsonData())
    }

    companion object {

        fun fromUpdateRequest(json: JsonObject): CronScriptDb {
            val id = json.getLong("id") ?: throw RuntimeException("No id provided")
            val collectionId = json.getLong("collectionId")
                ?: throw RuntimeException("No collectionId provided")
            val data = json.getJsonObject("data")
                ?: throw RuntimeException("No data provided")
            val res = CronScriptDb()
            res.id = id
            res.collectionId = collectionId
            res.setJsonData(data)
            return res
        }
    }

}
