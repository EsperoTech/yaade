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

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("ownerId", ownerId)
            .put("version", version)
            .put("data", JsonObject(data.decodeToString()))
    }

    fun getAllEnvs(): JsonObject {
        val envs = jsonData().getJsonObject("envs") ?: return JsonObject()
        envs.map?.forEach { (it.value as JsonObject).remove("secrets") }
        return envs
    }

    fun createEnv(name: String, data: JsonObject?) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        val oldEnv = envs.getJsonObject(name)
        if (oldEnv != null) throw RuntimeException("Env already exists")

        val env = JsonObject().put("data", data ?: JsonObject())
        envs.put(name, env)
        this.data = json.encode().toByteArray()
    }

    fun setEnvData(name: String, data: JsonObject) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        var env = envs.getJsonObject(name)
        if (env == null) {
            env = JsonObject()
            envs.put(name, env)
        }
        env.put("data", data)
        this.data = json.encode().toByteArray()
    }

    fun deleteEnv(name: String?) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        envs.remove(name)
        this.data = json.encode().toByteArray()
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
