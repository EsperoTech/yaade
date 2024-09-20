package com.espero.yaade.db

import com.espero.yaade.model.db.CronScriptDb
import com.j256.ormlite.support.ConnectionSource

class CronScriptDao(connectionSource: ConnectionSource) :
    BaseDao<CronScriptDb>(connectionSource, CronScriptDb::class.java) {

    fun get(id: Long): CronScriptDb? {
        return dao.queryForId(id)
    }

    fun getAll(): List<CronScriptDb> {
        return dao.queryForAll()
    }

    fun getAllInCollection(collectionId: Long): List<CronScriptDb> {
        return dao.queryForEq("collectionId", collectionId)
    }
}
