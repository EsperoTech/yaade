package com.espero.yaade.db

import com.espero.yaade.model.db.RequestDb
import com.j256.ormlite.support.ConnectionSource

class RequestDao(connectionSource: ConnectionSource) : BaseDao<RequestDb>(connectionSource, RequestDb::class.java) {
    fun getAll(): List<RequestDb> {
        return dao.queryForAll()
    }
}