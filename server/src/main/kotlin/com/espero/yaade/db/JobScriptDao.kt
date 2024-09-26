package com.espero.yaade.db

import com.espero.yaade.model.db.JobScriptDb
import com.j256.ormlite.support.ConnectionSource

class JobScriptDao(connectionSource: ConnectionSource) :
    BaseDao<JobScriptDb>(connectionSource, JobScriptDb::class.java) {

    fun get(id: Long): JobScriptDb? {
        return dao.queryForId(id)
    }

    fun getAll(): List<JobScriptDb> {
        return dao.queryForAll()
    }

    fun getAllInCollection(collectionId: Long): List<JobScriptDb> {
        return dao.queryForEq("collectionId", collectionId)
    }

    fun deleteAllInCollection(collectionId: Long) {
        val deleteBuilder = dao.deleteBuilder()
        val where = deleteBuilder.where().eq("collectionId", collectionId)
        deleteBuilder.setWhere(where)
        deleteBuilder.delete()
    }
}
