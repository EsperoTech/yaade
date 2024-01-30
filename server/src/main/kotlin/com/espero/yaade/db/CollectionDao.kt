package com.espero.yaade.db

import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import com.j256.ormlite.support.ConnectionSource
import io.vertx.core.json.JsonObject

class CollectionDao(connectionSource: ConnectionSource) :
    BaseDao<CollectionDb>(connectionSource, CollectionDb::class.java) {

    fun getAll(): List<CollectionDb> {
        return dao.queryForAll()
    }

    fun getForUser(user: UserDb): List<CollectionDb> {
        return getAll().filter { it.canRead(user) }
    }

    fun getByUserAndName(user: UserDb, name: String): List<CollectionDb> {
        return getAll().filter { it.isOwner(user) && it.getName() == name }
    }

    fun getSecrets(collectionId: Long, envname: String): JsonObject? {
        val collection: CollectionDb = getById(collectionId) ?: return null
        return collection.getSecrets(envname)
    }

    fun updateWithoutSecrets(c: CollectionDb) {
        val oldCollection = getById(c.id)
        if (oldCollection == null) {
            super.update(c)
            return
        }
        val oldEnvs = oldCollection.jsonData().getJsonObject("envs") ?: JsonObject()
        val data = c.jsonData()
        val envs = data.getJsonObject("envs") ?: JsonObject()
        val envNames = envs.map.map { it.key }
        envNames.forEach {
            val env = envs.getJsonObject(it)
            val oldEnv = oldEnvs.getJsonObject(it) ?: JsonObject()
            env.put("secrets", oldEnv.getJsonObject("secrets"))
            env.remove("secretKeys")
            envs.put(it, env)
        }

        data.put("envs", envs)
        c.data = data.encode().toByteArray()
        super.update(c)
    }

}
