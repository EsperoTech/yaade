package com.espero.yaade.services;

import com.espero.yaade.db.DaoManager;
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject;
import org.apache.commons.text.StringSubstitutor

class SecretInterpolator(private val daoManager: DaoManager) {

    fun interpolate(request: JsonObject, collectionId: Long?, envName: String): JsonObject {
        if (collectionId == null)
            return request
        val secrets: JsonObject =
            daoManager.collectionDao.getSecrets(collectionId, envName) ?: return request
        if (secrets.isEmpty)
            return request
        val substitutor = StringSubstitutor(secrets.map)
        return interpolate2(request, substitutor)
    }

    private fun interpolate2(
        request: JsonObject,
        substitutor: StringSubstitutor
    ): JsonObject {
        val result = JsonObject()
        request.forEach {
            result.put(it.key, interpolate1(it.value, substitutor))
        }

        return result
    }

    private fun interpolate1(value: Any, substitutor: StringSubstitutor): Any {
        return when (value) {
            is String -> interpolate0(value, substitutor)
            is JsonObject -> interpolate2(value, substitutor)
            is JsonArray -> value.map { interpolate1(it, substitutor) }
            else -> value
        }
    }

    private fun interpolate0(value: String, substitutor: StringSubstitutor): String {
        if (!value.contains("\$S{"))
            return value
        val v = value.replace("\$S{", "\${")
        return substitutor.replace(v)
    }
}
