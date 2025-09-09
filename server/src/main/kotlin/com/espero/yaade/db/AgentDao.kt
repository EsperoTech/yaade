package com.espero.yaade.db

import com.espero.yaade.model.db.AgentDb
import com.j256.ormlite.support.ConnectionSource

class AgentDao(connectionSource: ConnectionSource) : BaseDao<AgentDb>(connectionSource, AgentDb::class.java) {
    
    fun getByCollectionId(collectionId: Long): List<AgentDb> {
        return dao.queryForEq("collectionId", collectionId)
    }
    
    fun deleteAllInCollection(collectionId: Long): Int {
        val deleteBuilder = dao.deleteBuilder()
        val where = deleteBuilder.where().eq("collectionId", collectionId)
        deleteBuilder.setWhere(where)
        return deleteBuilder.delete()
    }
    
    fun delete(agent: AgentDb) {
        dao.delete(agent)
    }
    
    fun getAll(): List<AgentDb> {
        return dao.queryForAll()
    }
}