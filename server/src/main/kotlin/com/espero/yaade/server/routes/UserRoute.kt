package com.espero.yaade.server.routes

import com.espero.yaade.JDBC_PWD
import com.espero.yaade.JDBC_URL
import com.espero.yaade.JDBC_USR
import com.espero.yaade.db.DaoManager
import com.password4j.Password
import io.vertx.core.Vertx
import io.vertx.core.http.HttpHeaders
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await
import net.lingala.zip4j.ZipFile
import org.h2.tools.DeleteDbFiles
import java.util.*


class UserRoute(private val daoManager: DaoManager, private val vertx: Vertx) {
    fun getCurrentUser(ctx: RoutingContext) {
        try {
            val user = ctx.user()
            ctx.end(user.principal().encode())
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }

    }

    fun logout(ctx: RoutingContext) {
        try {
            ctx.session().destroy()
            ctx.end()
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun changePassword(ctx: RoutingContext) {
        try {
            val newPassword = ctx.bodyAsJson.getString("newPassword")
            val currentPassword = ctx.bodyAsJson.getString("currentPassword")
            val userId = ctx.user().principal().getString("id")

            val user = daoManager.userDao.getById(userId)

            if (!Password.check(currentPassword, user.password).withArgon2()) {
                ctx.fail(403)
            }

            user.password = Password.hash(newPassword).addRandomSalt().withArgon2().result

            daoManager.userDao.update(user)

            ctx.session().destroy()
            ctx.end()
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun exportBackup(ctx: RoutingContext) {
        try {
            val fileUuid = UUID.randomUUID().toString()
            daoManager.dataSource.connection.use { conn ->
                conn.prepareStatement("BACKUP TO '/tmp/$fileUuid'").executeUpdate()
            }
            ctx.response()
                .putHeader("Content-Disposition", "attachment; filename=\"yaade-db.mv.db.zip\"")
                .putHeader(HttpHeaders.TRANSFER_ENCODING, "chunked")
                .sendFile("/tmp/$fileUuid")
            vertx.fileSystem().delete("/tmp/$fileUuid")
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    suspend fun importBackup(ctx: RoutingContext) {
        try {
            val f = ctx.fileUploads().iterator().next()

            // create a backup so that data is not really lost...
            val fileUuid = UUID.randomUUID().toString()
            daoManager.dataSource.connection.use { conn ->
                conn.prepareStatement("BACKUP TO './app/data/$fileUuid'").executeUpdate()
            }

            daoManager.close()

            DeleteDbFiles.execute("./app/data", "yaade-db", false)
            ZipFile(f.uploadedFileName()).extractAll("./app/data")
            vertx.fileSystem().delete(f.uploadedFileName()).await()

            daoManager.init(JDBC_URL, JDBC_USR, JDBC_PWD)

            val response = JsonObject().put(f.fileName(), f.size())
            ctx.session().destroy()
            ctx.response().end(response.encode())
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }
}