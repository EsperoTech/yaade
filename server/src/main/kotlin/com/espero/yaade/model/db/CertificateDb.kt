package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import io.vertx.core.buffer.Buffer
import io.vertx.core.json.JsonObject
import io.vertx.core.net.PemTrustOptions
import io.vertx.ext.web.client.WebClientOptions
import java.net.URL

/*
    * Represents a certificate in the database.
    The structure of data is as follows:
    {
        "host": "example.com",
        "groups": ["group1", "group2"],
        "type": "pem",
        "pemConfig": {
            "cert": "... pem cert as string ..."
        }
    }
*/
class CertificateDb {

    private constructor()

    @DatabaseField(generatedId = true)
    var id: Long = -1

    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray

    constructor(data: ByteArray) {
        this.data = data
    }

    fun groups(): Set<String> {
        val result = mutableSetOf<String>()
        val data = JsonObject(data.decodeToString())
        val groups = data.getJsonArray("groups") ?: return result
        groups.forEach { result.add(it as String) }
        return result
    }

    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }

    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }

    fun doesHostMatch(url: String): Boolean {
        val data = jsonData()
        val host = data.getString("host") ?: return false
        return try {
            host == URL(url).host
        } catch (e: Exception) {
            false
        }
    }

    fun canRead(user: UserDb): Boolean {
        return user.isAdmin() || user.groups().intersect(this.groups())
            .isNotEmpty()
    }

    fun mutateWebClientOptions(webClientOptions: WebClientOptions) {
        val certData = jsonData()
        when (certData.getString("type")) {
            "pem" -> {
                val pemCert = certData.getJsonObject("pemConfig")?.getString("cert")
                    ?: return
                webClientOptions.pemTrustOptions = PemTrustOptions()
                    .addCertValue(Buffer.buffer(pemCert))
            }
        }
    }

    fun hideCerts(): CertificateDb {
        val data = jsonData()
        data.remove("pemConfig")
        setData(data)
        return this
    }

    fun toJson(): JsonObject {
        return JsonObject()
            .put("id", id)
            .put("data", JsonObject(data.decodeToString()))
    }

}
