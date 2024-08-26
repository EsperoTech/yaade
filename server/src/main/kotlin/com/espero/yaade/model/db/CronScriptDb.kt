package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "serverscript")
class CronScriptDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }
    
    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun toJson(): JsonObject {
        return JsonObject().put("id", id).put("data", jsonData())
    }

}
