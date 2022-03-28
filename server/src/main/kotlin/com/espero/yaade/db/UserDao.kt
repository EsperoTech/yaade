package com.espero.yaade.db

import com.espero.yaade.model.db.UserDb
import com.j256.ormlite.support.ConnectionSource

class UserDao(connectionSource: ConnectionSource) : BaseDao<UserDb>(connectionSource, UserDb::class.java) {
    fun getByUsername(username: String): UserDb? {
        return dao.queryForEq("username", username).getOrNull(0)
    }
}
