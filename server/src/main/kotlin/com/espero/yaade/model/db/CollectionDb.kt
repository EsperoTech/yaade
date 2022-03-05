package com.espero.yaade.model.db

import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.core.json.json
import io.vertx.kotlin.core.json.obj

@DatabaseTable(tableName = "collections")
class CollectionDb {
    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    lateinit var name: String

    @DatabaseField
    lateinit var description: String

    constructor(name: String, description: String) {
        this.name = name
        this.description = description
    }

    fun toJson(): JsonObject {
        return json {
            obj(
                "id" to id,
                "name" to name,
                "description" to description
            )
        }
    }

    companion object {
        fun fromJsonRequest(jsonObject: JsonObject): CollectionDb {
            return CollectionDb(
                jsonObject.getString("name"),
                jsonObject.getString("description")
            )
        }
    }
}