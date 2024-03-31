package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonArray
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
        return user.isAdmin() || isOwner(user) || user.groups().intersect(this.groups())
            .isNotEmpty()
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

    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun patchData(data: JsonObject) {
        val newData = jsonData()
        data.forEach { entry ->
            newData.put(entry.key, entry.value)
        }
        setData(newData)
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("ownerId", ownerId)
            .put("version", version)
            .put("data", JsonObject(data.decodeToString()))
    }

    fun hideSecrets() {
        val data = jsonData()
        val envs = data.getJsonObject("envs") ?: return
        val envNames = envs.map.map { it.key }
        envNames.forEach {
            val env = envs.getJsonObject(it)
            setSecretKeys(env)
        }
        data.put("envs", envs)
        this.data = data.encode().toByteArray()
    }

    private fun setSecretKeys(env: JsonObject) {
        val secrets = env.getJsonObject("secrets") ?: JsonObject()
        val keys = JsonArray()
        secrets.map.keys.forEach { keys.add(it) }
        env.put("secretKeys", keys)
        env.remove("secrets")
    }

    fun createEnv(name: String, req: JsonObject?) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        val oldEnv = envs.getJsonObject(name)
        if (oldEnv != null) throw RuntimeException("Env already exists")

        val env = JsonObject()
            .put("data", req?.getJsonObject("data") ?: JsonObject())
            .put("proxy", req?.getString("proxy") ?: "ext")
        envs.put(name, env)
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

    fun setEnvVar(envName: String, key: String, value: String) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        var env = envs.getJsonObject(envName)
        if (env == null) {
            env = JsonObject()
            envs.put(envName, env)
        }
        var data = env.getJsonObject("data")
        if (data == null) {
            data = JsonObject()
            env.put("data", JsonObject())
        }
        data.put(key, value)
        this.data = json.encode().toByteArray()
    }

    fun setSecret(envName: String, key: String, value: String) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        var env = envs.getJsonObject(envName)
        if (env == null) {
            env = JsonObject()
            envs.put(envName, env)
        }
        var secrets = env.getJsonObject("secrets")
        if (secrets == null) {
            secrets = JsonObject()
            env.put("secrets", secrets)
        }
        secrets.put(key, value)
        this.data = json.encode().toByteArray()
    }

    fun deleteSecret(envName: String, key: String) {
        val json = jsonData()
        var envs = json.getJsonObject("envs")
        if (envs == null) {
            envs = JsonObject()
            json.put("envs", envs)
        }
        var env = envs.getJsonObject(envName)
        if (env == null) {
            env = JsonObject()
            envs.put(envName, env)
        }
        var secrets = env.getJsonObject("secrets")
        if (secrets == null) {
            secrets = JsonObject()
            env.put("secrets", secrets)
        }
        secrets.remove(key)
        this.data = json.encode().toByteArray()
    }

    fun getSecrets(envName: String): JsonObject? {
        val json = JsonObject(data.decodeToString())
        val envs: JsonObject = json.getJsonObject("envs") ?: return null
        val env = envs.getJsonObject(envName) ?: return null
        return env.getJsonObject("secrets")
    }

    fun updateEnv(name: String, updatedEnv: JsonObject) {
        val updatedData = updatedEnv.getJsonObject("data")
        val updatedProxy = updatedEnv.getString("proxy")

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
        env.put("data", updatedData)
        env.put("proxy", updatedProxy)
        this.data = json.encode().toByteArray()
    }

    fun getCert(envName: String, host: String): String? {
        val env = this
            .jsonData()
            .getJsonObject("envs")
            ?.getJsonObject(envName)

        val certs = env?.getJsonArray("certs") ?: return null

        val cert = certs
            .map { it as JsonObject }
            .firstOrNull { it.getString("host") == host }
            ?: return null

        return cert.getString("cert")
    }

    fun setCert(envName: String, host: String, cert: String) {
        val json = jsonData()
        var envs = json.getJsonObject("envs") ?: throw RuntimeException("No envs")
        var env = envs.getJsonObject(envName)
        if (env == null) {
            env = JsonObject()
            envs.put(envName, env)
        }
        var certs = env.getJsonArray("certs")
        if (certs == null) {
            certs = JsonArray()
            env.put("certs", certs)
        }
        val newCert = JsonObject().put("host", host).put("cert", cert)
        certs.add(newCert)
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
