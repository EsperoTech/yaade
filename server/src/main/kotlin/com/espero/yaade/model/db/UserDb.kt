package com.espero.yaade.model.db

import com.espero.yaade.ADMIN_USERNAME
import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject
import io.vertx.ext.auth.User

val defaultSettings: JsonObject = JsonObject()
    .put("saveOnSend", true)
    .put("saveOnClose", true)

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

    constructor(username: String, hashedPassword: String, version: String, data: ByteArray) {
        this.username = username
        this.password = hashedPassword
        this.version = version
        this.data = data
    }

    fun changeSetting(key: String, value: Any) {
        val newData = jsonData()
        val newSettings = newData.getJsonObject("settings")
        newSettings.put(key, value)
        newData.put("settings", newSettings)
        data = newData.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("username", username)
            .put("version", version)
            .put("data", jsonData())
    }

    fun toSessionUser(): User {
        val sessionUser = User.fromName(username)
        sessionUser.principal()
            .put("id", id)
            .put("username", username)
            .put("version", version)
            .put("data", jsonData())
        return sessionUser
    }

    fun groups(): Set<String> {
        val result = mutableSetOf<String>()
        val groups = jsonData().getJsonArray("groups") ?: return result
        groups.forEach { result.add(it as String) }
        return result
    }

    fun setGroups(newGroups: Set<String>) = patchData(JsonObject().put("groups", newGroups))

    fun isAdmin(): Boolean {
        return username == ADMIN_USERNAME || groups().contains("admin")
    }

    fun patchData(data: JsonObject) {
        val newData = jsonData()
        data.forEach { entry ->
            newData.put(entry.key, entry.value)
        }
        setData(newData)
    }

    companion object {
        fun createWithDefaultSettings(username: String, hashedPassword: String, groups: List<String>): UserDb {
            val data = JsonObject()
                .put("settings", defaultSettings)
                .put("groups", groups)
                .encode().toByteArray()

            return UserDb(username, hashedPassword, "1.0.0", data)
        }
    }
}
