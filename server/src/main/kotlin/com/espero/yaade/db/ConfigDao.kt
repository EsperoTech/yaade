package com.espero.yaade.db

import com.espero.yaade.model.db.ConfigDb
import com.j256.ormlite.support.ConnectionSource

class ConfigDao(connectionSource: ConnectionSource) :
    BaseDao<ConfigDb>(connectionSource, ConfigDb::class.java) {

    fun getByName(name: String): ConfigDb? = dao.queryForEq("name", name).getOrNull(0)
}
