package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "config")
class ConfigDb {
    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    lateinit var name: String

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var config: ByteArray

    constructor(name: String, jsonValue: ByteArray) {
        this.name = name
        this.config = jsonValue
    }

    fun getConfig(): JsonObject {
        return JsonObject(config.decodeToString())
    }

    companion object {
        val AUTH_CONFIG = "auth_config"

        fun createEmptyAuthConfig(): ConfigDb {
            val defaultConfig = JsonObject().put("providers", JsonArray()).encode().toByteArray()
            return ConfigDb(AUTH_CONFIG, defaultConfig)
        }
    }
}