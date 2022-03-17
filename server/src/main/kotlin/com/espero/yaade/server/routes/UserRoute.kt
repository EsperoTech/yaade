package com.espero.yaade.server.routes

import com.espero.yaade.JDBC_PWD
import com.espero.yaade.JDBC_URL
import com.espero.yaade.JDBC_USR
import com.espero.yaade.db.DaoManager
import com.espero.yaade.init.createHikariConfig
import com.j256.ormlite.jdbc.DataSourceConnectionSource
import com.password4j.Password
import com.zaxxer.hikari.HikariDataSource
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
            val response = JsonObject()
            val f = ctx.fileUploads().iterator().next()

            daoManager.connectionSource.close()
            com.j256.ormlite.dao.DaoManager.clearCache()

            DeleteDbFiles.execute("./app/data", "yaade-db", false)
            ZipFile(f.uploadedFileName()).extractAll("./app/data")
            vertx.fileSystem().delete(f.uploadedFileName()).await()

            val hikariConfig = createHikariConfig(JDBC_URL, JDBC_USR, JDBC_PWD)
            val dataSource = HikariDataSource(hikariConfig)
            val connectionSource = DataSourceConnectionSource(dataSource, JDBC_URL)
            daoManager.init(dataSource, connectionSource)

            response.put(f.fileName(), f.size())
            ctx.session().destroy()
            ctx.response().end(response.encode())
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }
}