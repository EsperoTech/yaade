package com.espero.yaade.db

import com.espero.yaade.model.db.FileDb
import com.j256.ormlite.support.ConnectionSource

class FileDao(connectionSource: ConnectionSource) :
    BaseDao<FileDb>(connectionSource, FileDb::class.java) {

    fun getAll(): List<FileDb> {
        return dao.queryForAll()
    }
}
