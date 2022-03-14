package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "collections")
class CollectionDb {
    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    lateinit var version: String

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(name: String) {
        this.version = "1.0.0"
        this.data = JsonObject()
            .put("name", name)
            .encode().toByteArray()
    }

    constructor(id: Long, version: String, data: JsonObject) {
        this.id = id
        this.version = version
        this.data = data.encode().toByteArray()
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("version", version)
            .put("data", JsonObject(data.decodeToString()))
    }

    companion object {
        fun fromUpdateRequest(request: JsonObject): CollectionDb {
            return CollectionDb(
                id = request.getLong("id"),
                version = request.getString("version"),
                data = request.getJsonObject("data")
            )
        }
    }
}