package com.espero.yaade.server.routes

import com.espero.yaade.JDBC_PWD
import com.espero.yaade.JDBC_URL
import com.espero.yaade.JDBC_USR
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.UserDb
import io.vertx.core.Vertx
import io.vertx.core.http.HttpHeaders
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await
import io.vertx.kotlin.coroutines.awaitBlocking
import net.lingala.zip4j.ZipFile
import org.apache.http.HttpStatus
import org.h2.tools.DeleteDbFiles
import java.util.UUID

class AdminRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun exportBackup(ctx: RoutingContext) {
        val fileUuid = UUID.randomUUID().toString()
        daoManager.dataSource.connection.use { conn ->
            conn.prepareStatement("BACKUP TO '/tmp/$fileUuid'").executeUpdate()
        }

        ctx.response()
            .putHeader("Content-Disposition", "attachment; filename=\"yaade-db.mv.db.zip\"")
            .putHeader(HttpHeaders.TRANSFER_ENCODING, "chunked")
            .sendFile("/tmp/$fileUuid").await()

        vertx.fileSystem().delete("/tmp/$fileUuid")
    }

    suspend fun importBackup(ctx: RoutingContext) {
        val f = ctx.fileUploads().iterator().next()

        // create a backup so that data is not really lost...
        val fileUuid = UUID.randomUUID().toString()
        daoManager.dataSource.connection.use { conn ->
            conn.prepareStatement("BACKUP TO './app/data/$fileUuid'").executeUpdate()
        }

        daoManager.close()

        DeleteDbFiles.execute("./app/data", "yaade-db", false)
        awaitBlocking {
            ZipFile(f.uploadedFileName()).extractAll("./app/data")
        }
        vertx.fileSystem().delete(f.uploadedFileName()).await()

        daoManager.init(JDBC_URL, JDBC_USR, JDBC_PWD)

        val response = JsonObject().put(f.fileName(), f.size())
        ctx.session().destroy()
        ctx.response().end(response.encode()).await()
    }

    suspend fun createUser(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()

        val username = body.getString("username")
        val groups = body.getJsonArray("groups").map { it as String }
        if (daoManager.userDao.getByUsername(username) != null) {
            ctx.fail(HttpStatus.SC_CONFLICT)
            return
        }

        val result = daoManager.userDao.createUser(username, groups)

        ctx.end(result.toJson().encode()).await()
    }

    suspend fun deleteUser(ctx: RoutingContext) {
        val userId = ctx.pathParam("userId").toLong()
        val user = daoManager.userDao.getById(userId)
        if (user == null || user.username == "admin") {
            ctx.fail(HttpStatus.SC_BAD_REQUEST)
            return
        }
        daoManager.userDao.deleteUser(userId)
        ctx.end().await()
    }

    suspend fun updateUser(ctx: RoutingContext) {
        val userId = ctx.pathParam("userId").toLong()
        val data = ctx.body().asJsonObject().getJsonObject("data")
        val result = daoManager.userDao.updateUser(userId, data)

        ctx.end(result.toJson().encode()).await()
    }

    suspend fun getUsers(ctx: RoutingContext) {
        val result = JsonArray(daoManager.userDao.getUsers().map(UserDb::toJson))
        ctx.end(result.encode()).await()
    }

    suspend fun resetUserPassword(ctx: RoutingContext) {
        val userId = ctx.pathParam("userId").toLong()
        daoManager.userDao.resetPassword(userId)
        ctx.end().await()
    }
}
