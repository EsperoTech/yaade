package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CertificateDb
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Vertx
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait

class CertificateRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun getCertificates(ctx: RoutingContext) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw RuntimeException("No user found for id $userId")

        val certificates = daoManager.certificatesDao.getAll()
        val response = certificates
            .filter { it.canRead(user) }
            .map { it.hideCerts() }
            .map { it.toJson() }
        ctx.end(
            JsonObject()
                .put("certificates", JsonArray(response))
                .encode()
        ).coAwait()
    }

    suspend fun createCertificate(ctx: RoutingContext) {
        val type = ctx.request().getFormAttribute("type")
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No type provided for certificate creation"
            )
        val host = ctx.request().getFormAttribute("host")
            ?: throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No host provided for certificate creation"
            )
        val groups = ctx.request().getFormAttribute("groups") ?: ""
        val data = JsonObject()
            .put("type", type)
            .put("host", host)
        if (groups.isNotEmpty()) {
            data.put("groups", JsonArray(groups.split(",")))
        } else {
            data.put("groups", JsonArray())
        }
        when (type) {
            "pem" -> {
                val pemConfig = JsonObject()
                val f = ctx.fileUploads().firstOrNull { it.name() == "pemCert" }
                    ?: throw ServerError(
                        HttpResponseStatus.BAD_REQUEST.code(),
                        "No certificate file provided for PEM certificate creation"
                    )
                // read the content of the file into a string
                val pemCert = vertx.fileSystem().readFile(f.uploadedFileName()).coAwait().toString()
                pemConfig.put("cert", pemCert)
                data.put("pemConfig", pemConfig)
            }

            else -> {
                throw ServerError(
                    HttpResponseStatus.BAD_REQUEST.code(),
                    "Unknown certificate type: $type"
                )
            }
        }

        val certificate = CertificateDb(data.encode().toByteArray())
        daoManager.certificatesDao.create(certificate)
        ctx.end(certificate.hideCerts().toJson().encode()).coAwait()
    }

    suspend fun deleteCertificate(ctx: RoutingContext) {
        val principal = ctx.user().principal()
        val userId = principal.getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw RuntimeException("No user found for id $userId")

        val id = ctx.pathParam("id").toLong()

        val certificate = daoManager.certificatesDao.getById(id)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "No certificate found for id $id"
            )

        if (!certificate.canRead(user))
            throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "Certificate not found for id: $id"
            )

        daoManager.certificatesDao.delete(certificate.id)
        ctx.end().coAwait()
    }

}
