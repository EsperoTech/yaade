package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "users")
class UserDb {
    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    lateinit var username: String

    @DatabaseField
    lateinit var password: String

    @DatabaseField
    lateinit var version: String

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(username: String, hashedPassword: String) {
        this.username = username
        this.password = hashedPassword
        this.version = "1.0.0"
        this.data = JsonObject()
            .encode().toByteArray()
    }

    constructor(id: Long, username: String, hashedPassword: String, version: String, data: ByteArray) {
        this.id = id
        this.username = username
        this.password = hashedPassword
        this.version = version
        this.data = data
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("username", username)
            .put("version", version)
            .put("data", JsonObject(data.decodeToString()))
    }
}
