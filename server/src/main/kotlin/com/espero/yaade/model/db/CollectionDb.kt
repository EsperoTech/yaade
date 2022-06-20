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
    var ownerId: Long = -1

    @DatabaseField
    lateinit var version: String

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(data: JsonObject, ownerId: Long) {
        this.ownerId = ownerId
        this.version = "1.0.0"
        this.data = data.encode().toByteArray()
    }

    constructor(id: Long, ownerId: Long, version: String, data: JsonObject) {
        this.id = id
        this.ownerId = ownerId
        this.version = version
        this.data = data.encode().toByteArray()
    }

    fun canRead(user: UserDb): Boolean {
        return user.isAdmin() || isOwner(user) || user.groups().intersect(this.groups()).isNotEmpty()
    }

    fun groups(): Set<String> {
        val result = mutableSetOf<String>()
        val data = JsonObject(data.decodeToString())
        val groups = data.getJsonArray("groups") ?: return result
        groups.forEach { result.add(it as String) }
        return result
    }

    fun isOwner(user: UserDb): Boolean {
        return user.id == this.ownerId
    }

    fun getName(): String {
        val json = JsonObject(data.decodeToString())
        return json.getString("name")
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("ownerId", ownerId)
            .put("version", version)
            .put("data", JsonObject(data.decodeToString()))
    }

    companion object {
        fun fromUpdateRequest(request: JsonObject): CollectionDb {
            return CollectionDb(
                id = request.getLong("id"),
                ownerId = request.getLong("ownerId"),
                version = request.getString("version"),
                data = request.getJsonObject("data")
            )
        }
    }
}
