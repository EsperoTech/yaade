package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "file")
class FileDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField
    lateinit var name: String

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(name: String, data: ByteArray) {
        this.name = name
        this.data = data
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun groups(): Set<String> {
        val result = mutableSetOf<String>()
        val data = this.jsonData()
        val groups = data.getJsonArray("groups") ?: return result
        groups.forEach { result.add(it as String) }
        return result
    }

    fun canBeReadBy(user: UserDb): Boolean {
        return user.isAdmin() || user.groups().intersect(this.groups()).isNotEmpty()
    }

    fun toJson(): JsonObject {
        return JsonObject().put("id", id).put("name", name).put("data", jsonData())
    }

    companion object {

        fun fromCreateRequest(name: String, groups: Set<String>): FileDb {
            val defaultConfig =
                JsonObject().put("groups", JsonArray(groups.toList())).encode().toByteArray()
            return FileDb(name, defaultConfig)
        }
    }
}
