package com.espero.yaade.db

import com.espero.yaade.model.db.RequestDb
import com.j256.ormlite.support.ConnectionSource

class RequestDao(connectionSource: ConnectionSource) : BaseDao<RequestDb>(connectionSource, RequestDb::class.java) {
    fun getAllInCollection(collectionId: Long): List<RequestDb> {
        return dao.queryForEq("collectionId", collectionId)
    }

    fun deleteAllInCollection(collectionId: String) {
        val deleteBuilder = dao.deleteBuilder()
        val where = deleteBuilder.where().eq("collectionId", collectionId)
        deleteBuilder.setWhere(where)
        deleteBuilder.delete()
    }
}
