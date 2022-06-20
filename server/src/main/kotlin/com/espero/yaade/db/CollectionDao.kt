package com.espero.yaade.db

import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import com.j256.ormlite.support.ConnectionSource

class CollectionDao(connectionSource: ConnectionSource) :
    BaseDao<CollectionDb>(connectionSource, CollectionDb::class.java) {
    fun getAll(): List<CollectionDb> {
        return dao.queryForAll()
    }

    fun getForUser(user: UserDb): List<CollectionDb> {
        return getAll().filter { it.canRead(user) }
    }

    fun getByUser(user: UserDb): List<CollectionDb> {
        return getAll().filter { it.isOwner(user) }
    }

    fun getByUserAndName(user: UserDb, name: String): List<CollectionDb> {
        return getAll().filter { it.isOwner(user) && it.getName() == name }
    }
}
