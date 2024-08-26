package com.espero.yaade.db

import com.espero.yaade.model.db.CronScriptDb
import com.j256.ormlite.support.ConnectionSource

class CronScriptDao(connectionSource: ConnectionSource) :
    BaseDao<CronScriptDb>(connectionSource, CronScriptDb::class.java) {

    fun getAll(): List<CronScriptDb> {
        return dao.queryForAll()
    }
}
