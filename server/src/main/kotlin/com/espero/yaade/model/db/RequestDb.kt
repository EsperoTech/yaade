package com.espero.yaade.model.db

import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.core.json.json
import io.vertx.kotlin.core.json.obj

@DatabaseTable(tableName = "requests")
class RequestDb {
    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    fun toJson(): JsonObject {
        return json {
            obj(
                "id" to id
            )
        }
    }
}