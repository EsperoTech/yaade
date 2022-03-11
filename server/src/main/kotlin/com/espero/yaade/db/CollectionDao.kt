package com.espero.yaade.db

import com.espero.yaade.model.db.CollectionDb
import com.j256.ormlite.support.ConnectionSource

class CollectionDao(connectionSource: ConnectionSource) : BaseDao<CollectionDb>(connectionSource, CollectionDb::class.java) {
    fun getAll(): List<CollectionDb> {
        return dao.queryForAll()
    }
}