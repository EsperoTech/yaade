package com.espero.yaade.server.routes

import com.espero.yaade.JDBC_PWD
import com.espero.yaade.JDBC_URL
import com.espero.yaade.JDBC_USR
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.ConfigDb
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.Server
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.server.utils.awaitBlocking
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Vertx
import io.vertx.core.http.HttpHeaders
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.awaitBlocking
import io.vertx.kotlin.coroutines.coAwait
import net.lingala.zip4j.ZipFile
import org.h2.tools.DeleteDbFiles
import java.util.*
import java.util.concurrent.Callable

class AdminRoute(
    private val daoManager: DaoManager,
    private val vertx: Vertx,
    private val validateAuthConfig: suspend (authConfig: JsonObject) -> Unit,
    private val server: Server
) {

    suspend fun exportBackup(ctx: RoutingContext) {
        val fileUuid = UUID.randomUUID().toString()
        daoManager.dataSource.connection.use { conn ->
            conn.prepareStatement("BACKUP TO '/tmp/$fileUuid'").executeUpdate()
        }

        ctx.response()
            .putHeader("Content-Disposition", "attachment; filename=\"yaade-db.mv.db.zip\"")
            .putHeader(HttpHeaders.TRANSFER_ENCODING, "chunked")
            .sendFile("/tmp/$fileUuid").coAwait()

        vertx.fileSystem().delete("/tmp/$fileUuid")
    }

    suspend fun importBackup(ctx: RoutingContext) {
        val f = ctx.fileUploads().iterator().next()

        // create a backup so that data is not really lost...
        val fileUuid = UUID.randomUUID().toString()
        vertx.awaitBlocking {
            daoManager.dataSource.connection.use { conn ->
                conn.prepareStatement("BACKUP TO './app/data/$fileUuid'").executeUpdate()
            }
        }
        daoManager.close()

        DeleteDbFiles.execute("./app/data", "yaade-db", false)
        awaitBlocking {
            ZipFile(f.uploadedFileName()).extractAll("./app/data")
        }
        vertx.fileSystem().delete(f.uploadedFileName()).coAwait()

        daoManager.init(JDBC_URL, JDBC_USR, JDBC_PWD)

        val response = JsonObject().put(f.fileName(), f.size())
        ctx.response().end(response.encode()).coAwait()
        server.restartServer()
    }

    suspend fun createUser(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()

        val username = body.getString("username")
        val groups = body.getJsonArray("groups").map { it as String }
        if (daoManager.userDao.getByUsername(username) != null) {
            throw ServerError(
                HttpResponseStatus.CONFLICT.code(),
                "A user with the name $username already exists"
            )
        }

        val result = daoManager.userDao.createUser(username, groups)

        ctx.end(result.toJson().encode())
    }

    suspend fun deleteUser(ctx: RoutingContext) {
        val userId = ctx.pathParam("userId").toLong()
        val user = daoManager.userDao.getById(userId)
        if (user == null || user.username == "admin") {
            throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "Cannot delete. User does not exist"
            )
        }
        daoManager.userDao.deleteUser(userId)
        ctx.end()
    }

    suspend fun updateUser(ctx: RoutingContext) {
        val userId = ctx.pathParam("userId").toLong()
        if (userId <= 0)
            throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "userId is invalid: $userId")
        val data =
            ctx.body().asJsonObject().getJsonObject("data")
                ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No body provided")
        val result = daoManager.userDao.updateUser(userId, data)

        ctx.end(result.toJson().encode())
    }

    suspend fun getUsers(ctx: RoutingContext) {
        val result = JsonArray(daoManager.userDao.getUsers().map(UserDb::toJson))
        ctx.end(result.encode())
    }

    suspend fun resetUserPassword(ctx: RoutingContext) {
        val userId = ctx.pathParam("userId").toLong()
        vertx.executeBlocking(
            Callable {
                daoManager.userDao.resetPassword(userId)
            }).coAwait()
        ctx.end()
    }

    suspend fun getConfig(ctx: RoutingContext) {
        val configName = ctx.pathParam("name") ?: throw RuntimeException("No config name provided")
        val config = daoManager.configDao.getByName(configName)
            ?: throw ServerError(
                HttpResponseStatus.NOT_FOUND.code(),
                "Config not found for name $configName"
            )
        ctx.end(config.config.decodeToString())
    }

    suspend fun updateConfig(ctx: RoutingContext) {
        val configName = ctx.pathParam("name")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No config name provided")
        val config: JsonObject
        try {
            config = ctx.body().asJsonObject()
        } catch (t: Throwable) {
            throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                t.message ?: "Could not parse json"
            )
        }
        when (configName) {
            ConfigDb.AUTH_CONFIG -> updateAuthConfig(config)
            else -> throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "No config name provided"
            )
        }
        ctx.end().coAwait()
        server.restartServer()
    }

    private suspend fun updateAuthConfig(config: JsonObject) {
        var updatedConfig = daoManager.configDao.getByName(ConfigDb.AUTH_CONFIG)
        if (updatedConfig == null) {
            val newConfig = ConfigDb.createEmptyAuthConfig()
            daoManager.configDao.create(newConfig)
            updatedConfig = newConfig
        }
        updatedConfig.config = config.encode().toByteArray()
        validateAuthConfig(updatedConfig.getConfig())
        daoManager.configDao.update(updatedConfig)
    }
}
