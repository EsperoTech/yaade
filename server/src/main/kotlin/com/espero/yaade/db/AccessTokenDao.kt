package com.espero.yaade.db

import com.espero.yaade.model.db.AccessTokenDb
import com.j256.ormlite.support.ConnectionSource

class AccessTokenDao(connectionSource: ConnectionSource) :
    BaseDao<AccessTokenDb>(connectionSource, AccessTokenDb::class.java) {

    fun getAll(): List<AccessTokenDb> {
        return dao.queryForAll()
    }

    fun getByPublicId(publicId: String): AccessTokenDb? {
        return dao.queryForEq("publicId", publicId).firstOrNull()
    }

    fun getByOwnerId(ownerId: Long): List<AccessTokenDb> {
        return dao.queryForEq("ownerId", ownerId)
    }

    fun getByHashedSecret(hashedSecret: String): AccessTokenDb? {
        return dao.queryForEq("secret", hashedSecret).firstOrNull()
    }
}
