package com.espero.yaade.server.routes

import com.espero.yaade.FILE_STORAGE_PATH
import com.espero.yaade.JDBC_PWD
import com.espero.yaade.JDBC_URL
import com.espero.yaade.JDBC_USR
import com.espero.yaade.db.DaoManager
import com.espero.yaade.init.doSqliteMigration
import com.espero.yaade.model.db.ConfigDb
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.Server
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Vertx
import io.vertx.core.buffer.Buffer
import io.vertx.core.http.HttpHeaders
import io.vertx.core.impl.logging.LoggerFactory
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.awaitBlocking
import io.vertx.kotlin.coroutines.coAwait
import net.lingala.zip4j.ZipFile
import java.io.File
import java.util.*
import java.util.concurrent.Callable

class AdminRoute(
    private val daoManager: DaoManager,
    private val vertx: Vertx,
    private val validateAuthConfig: suspend (authConfig: JsonObject) -> Unit,
    private val server: Server
) {

    private val log = LoggerFactory.getLogger(AdminRoute::class.java)

    suspend fun exportBackup(ctx: RoutingContext) {
        try {
            println("Exporting backup")
            val dbFilename = "yaade-db.sqlite"
            val filesDirname = "files"
            val backupFilename = "yaade-db.backup.zip"
            val metadataFilename = "metadata.json"

            val backupFile = File("/tmp/$dbFilename")
            if (backupFile.exists()) {
                backupFile.delete()
            }

            daoManager.dataSource.connection.use { conn ->
                val stmt = conn.createStatement()
                stmt.executeUpdate("VACUUM INTO '/tmp/$dbFilename'")
            }

            val backupMetadata = JsonObject()
                .put("version", 1)
                .put("createdAt", System.currentTimeMillis())
                .put("db", dbFilename)
                .put("files", filesDirname)

            awaitBlocking {
                vertx.fileSystem()
                    .writeFileBlocking(
                        "/tmp/$metadataFilename",
                        Buffer.buffer(backupMetadata.encode())
                    )

                val zipFile = ZipFile("/tmp/$backupFilename")
                zipFile.addFile("/tmp/$metadataFilename")
                zipFile.addFile("/tmp/$dbFilename")

                val filesDir = File("/tmp/$filesDirname")
                filesDir.deleteRecursively()
                filesDir.mkdir()

                val files = vertx.fileSystem().readDirBlocking(FILE_STORAGE_PATH)
                for (file in files) {
                    val filename = File(file).name
                    vertx.fileSystem().copyBlocking(file, "/tmp/$filesDirname/$filename")
                }

                zipFile.addFolder(filesDir)
            }

            ctx.response()
                .putHeader(
                    "Content-Disposition",
                    "attachment; filename=\"yaade.backup\""
                )
                .putHeader(HttpHeaders.TRANSFER_ENCODING, "chunked")
                .sendFile("/tmp/$backupFilename").coAwait()

            vertx.fileSystem().delete("/tmp/$metadataFilename").coAwait()
            vertx.fileSystem().delete("/tmp/$dbFilename").coAwait()
            vertx.fileSystem().delete("/tmp/$backupFilename").coAwait()
        } catch (e: Throwable) {
            println("Error exporting backup: ${e.message}")
        }
    }

    suspend fun importBackup(ctx: RoutingContext) {
        val f = ctx.fileUploads().iterator().next()
        val fileUuid = UUID.randomUUID().toString()
        val backupPath = "./app/data/$fileUuid.sqlite"
        if (!JDBC_URL.startsWith("jdbc:sqlite:")) {
            throw ServerError(
                HttpResponseStatus.BAD_REQUEST.code(),
                "Importing backups is only supported for Sqlite databases"
            )
        }
        val dbPath = JDBC_URL.replace("jdbc:sqlite:", "")
        // Close the current database connection
        daoManager.close()

        try {
            vertx.fileSystem().copy(dbPath, backupPath).coAwait()
            vertx.fileSystem().copyRecursive(FILE_STORAGE_PATH, "/tmp/files", true).coAwait()
            vertx.fileSystem().delete(dbPath).coAwait()
            vertx.fileSystem().deleteRecursive(FILE_STORAGE_PATH, true).coAwait()

            awaitBlocking {
                ZipFile(f.uploadedFileName()).extractAll("/tmp/$fileUuid")
                val extracted = File("/tmp/$fileUuid")

                val metadataFile = File("/tmp/$fileUuid/metadata.json")

                // if it doesn't exist, it's an old h2 backup
                if (!metadataFile.exists()) {
                    doSqliteMigration(dbPath, extracted.absolutePath + "/yaade-db.mv.db")
                    return@awaitBlocking
                }

                val metadata = JsonObject(metadataFile.readText())
                val dbFilename = metadata.getString("db")
                val filesDirname = metadata.getString("files")

                val dbFile = File("/tmp/$fileUuid/$dbFilename")
                if (!dbFile.exists()) {
                    throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "Invalid backup file")
                }
                vertx.fileSystem().copyBlocking(dbFile.absolutePath, dbPath)

                val filesDir = File("/tmp/$fileUuid/$filesDirname")
                if (!filesDir.exists()) {
                    throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "Invalid backup file")
                }

                val files = filesDir.listFiles()
                for (file in files) {
                    val filename = file.name
                    vertx.fileSystem()
                        .copyBlocking(file.absolutePath, "$FILE_STORAGE_PATH/$filename")
                }

            }

            try {
                vertx.fileSystem().delete(f.uploadedFileName()).coAwait()
                vertx.fileSystem().deleteRecursive("/tmp/$fileUuid", true).coAwait()
                vertx.fileSystem().deleteRecursive("/tmp/files", true).coAwait()
            } catch (e: Throwable) {
                log.warn("Error cleaning up after import: ${e.message}")
            }
        } catch (e: Throwable) {
            log.error("Error importing database backup, reverting: ${e.message}")
            vertx.fileSystem().copy(backupPath, dbPath).coAwait()
            vertx.fileSystem().copyRecursive("/tmp/files", FILE_STORAGE_PATH, true).coAwait()
        } finally {
            // Reinitialize the database connection
            daoManager.init(JDBC_URL, JDBC_USR, JDBC_PWD)

            val response = JsonObject().put(f.fileName(), f.size())
            ctx.response().end(response.encode()).coAwait()
            server.restartServer()
        }
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
