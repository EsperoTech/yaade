package com.espero.yaade.db

import com.j256.ormlite.dao.Dao
import com.j256.ormlite.dao.DaoManager
import com.j256.ormlite.support.ConnectionSource
import com.j256.ormlite.table.TableUtils

open class BaseDao<T : Any>(connectionSource: ConnectionSource, clazz: Class<T>) {
    protected val dao: Dao<T, String> = DaoManager.createDao(connectionSource, clazz)

    init {
        TableUtils.createTableIfNotExists(connectionSource, clazz)
    }

    fun getById(id: String): T {
        return dao.queryForId(id)
    }

    fun create(data: T) {
        dao.create(data)
    }

    fun update(data: T) {
        dao.update(data)
    }
}