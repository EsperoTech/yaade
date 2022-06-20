package com.espero.yaade.db

import com.espero.yaade.ADMIN_USERNAME
import com.espero.yaade.model.db.UserDb
import com.j256.ormlite.support.ConnectionSource
import com.password4j.Password
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

class UserDao(connectionSource: ConnectionSource) : BaseDao<UserDb>(connectionSource, UserDb::class.java) {
    private val defaultPassword = System.getenv(DEFAULT_PW_ENV) ?: DEFAULT_PW

    fun getByUsername(username: String): UserDb? {
        return dao.queryForEq("username", username).getOrNull(0)
    }

    fun createUser(username: String, groups: List<String>): UserDb {
        val hashedPassword = Password.hash(defaultPassword).addRandomSalt().withArgon2().result
        val user = UserDb.createWithDefaultSettings(username, hashedPassword, groups)
        dao.create(user)
        return user
    }

    private fun getByIdOrThrow(userId: Long): UserDb {
        return getById(userId) ?: throw RuntimeException("User not found for id $userId")
    }

    fun updateUser(userId: Long, data: JsonObject): UserDb {
        val user = getByIdOrThrow(userId)
        user.setData(data)
        dao.update(user)
        return user
    }

    fun deleteUser(userId: Long): UserDb {
        val user = getByIdOrThrow(userId)
        dao.delete(user)
        return user
    }

    fun getUsers(): List<UserDb> {
        return dao.queryForAll()
    }

    fun userGroups(username: String): JsonArray {
        val user = getByUsername(username) ?: return JsonArray()
        return user.jsonData().getJsonArray("groups") ?: return JsonArray()
    }

    fun isAdmin(username: String): Boolean {
        return username == ADMIN_USERNAME || userGroups(username).contains("admin")
    }

    fun resetPassword(userId: Long): UserDb {
        val user = getByIdOrThrow(userId)
        val hashedPassword = Password.hash(defaultPassword).addRandomSalt().withArgon2().result
        user.password = hashedPassword
        dao.update(user)
        return user
    }

    companion object {
        const val DEFAULT_PW_ENV = "YAADE_DEFAULT_PASSWORD"
        const val DEFAULT_PW = "password"
    }
}
