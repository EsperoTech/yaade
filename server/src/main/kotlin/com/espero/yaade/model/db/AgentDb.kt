package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "agents")
class AgentDb {
    
    private constructor()
    
    @DatabaseField(generatedId = true)
    var id: Long = -1
    
    @DatabaseField(index = true) 
    var collectionId: Long = -1
    
    @DatabaseField
    lateinit var version: String
    
    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray
    
    constructor(collectionId: Long, data: JsonObject) {
        this.collectionId = collectionId
        this.version = "1.0.0"
        this.data = data.encode().toByteArray()
    }
    
    constructor(id: Long, collectionId: Long, version: String, data: JsonObject) {
        this.id = id
        this.collectionId = collectionId
        this.version = version
        this.data = data.encode().toByteArray()
    }
    
    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }
    
    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }
    
}