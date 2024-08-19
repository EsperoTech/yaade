package com.espero.yaade.server.routes

import com.espero.yaade.FILE_STORAGE_PATH
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.FileDb
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.coAwait
import java.nio.file.Files
import java.nio.file.Paths

class FileRoute(private val daoManager: DaoManager) {

    init {
        Files.createDirectories(Paths.get(FILE_STORAGE_PATH))
    }

    suspend fun getFiles(ctx: RoutingContext) {
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User does not exist")

        val files = daoManager.fileDao.getAll()
        val response = files
            .filter { it.canBeReadBy(user) }
            .map { JsonObject().put("id", it.id).put("name", it.name).put("data", it.jsonData()) }
        ctx.end(JsonObject().put("files", response).encode()).coAwait()
    }

    suspend fun uploadFile(ctx: RoutingContext) {
        val file = ctx.fileUploads().first()
        val rawGroups = ctx.request().getFormAttribute("groups") ?: ""
        val groups = rawGroups.split(",").toSet()
        val fileDb = FileDb.fromCreateRequest(file.fileName(), groups)
        daoManager.fileDao.create(fileDb)

        Files.move(
            Paths.get(file.uploadedFileName()),
            Paths.get(FILE_STORAGE_PATH, fileDb.id.toString())
        )

        ctx.end(fileDb.toJson().encode()).coAwait()
    }

    suspend fun downloadFile(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User does not exist")

        val file = daoManager.fileDao.getById(id)

        if (file == null || !file.canBeReadBy(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "File does not exist")
        }

        val filePath = Paths.get(FILE_STORAGE_PATH, id.toString())

        if (!Files.exists(filePath)) {
            throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "File does not exist")
        }

        ctx.response().sendFile(filePath.toString())
    }

    suspend fun deleteFile(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User does not exist")

        val file = daoManager.fileDao.getById(id)

        if (file == null || !file.canBeReadBy(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "File does not exist")
        }

        daoManager.fileDao.delete(file.id)
        Files.deleteIfExists(Paths.get(FILE_STORAGE_PATH, file.id.toString()))

        ctx.end()
    }
}
