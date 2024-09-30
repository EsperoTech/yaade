package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject
import java.util.*

@DatabaseTable(tableName = "accesstokens")
class AccessTokenDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    var publicId: String = UUID.randomUUID().toString()

    @DatabaseField(unique = true)
    lateinit var secret: String

    @DatabaseField
    var ownerId: Long = -1

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(hashedSecret: String, ownerId: Long, data: JsonObject) {
        this.secret = hashedSecret
        this.ownerId = ownerId
        this.data = data.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", publicId)
            .put("ownerId", ownerId)
            .put("data", jsonData())
    }

}
