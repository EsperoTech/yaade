package com.espero.yaade.init

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.Server
import io.vertx.core.impl.logging.LoggerFactory
import java.io.File

const val defaultH2FilePath = "./app/data/yaade-db"
const val h2Extension = ".mv.db"
const val defaultSqliteFilePath = "./app/data/yaade-db.sqlite"

private val log = LoggerFactory.getLogger(Server::class.java)

fun createDaoManager(jdbcUrl: String, jdbcUser: String, jdbcPwd: String): DaoManager {
    checkForMigration(jdbcUrl)
    val daoManager = DaoManager()
    daoManager.init(jdbcUrl, jdbcUser, jdbcPwd)
    return daoManager
}

fun checkForMigration(jdbcUrl: String) {
    if (jdbcUrl != "jdbc:sqlite:$defaultSqliteFilePath") {
        return
    }
    if (File(defaultSqliteFilePath).exists()) {
        return
    }
    if (!File("$defaultH2FilePath$h2Extension").exists()) {
        return
    }
    doSqliteMigration(defaultSqliteFilePath, defaultH2FilePath)
}

fun doSqliteMigration(sqliteFilePath: String, h2FilePath: String) {
    log.info("Migrating from H2 to SQLite")
    val sqliteManager = DaoManager()
    sqliteManager.init("jdbc:sqlite:$sqliteFilePath", "", "")
    val h2Manager = DaoManager()
    h2Manager.init("jdbc:h2:file:$h2FilePath", "sa", "")

    // Create backup of original H2 database
    h2Manager.dataSource.connection.use { conn ->
        conn.prepareStatement("BACKUP TO '$h2FilePath$h2Extension.bak'").executeUpdate()
    }

    // Create tables in SQLite first (this happens automatically when we access the DAOs)
    sqliteManager.accessTokenDao.getAll()
    sqliteManager.certificatesDao.getAll()
    sqliteManager.collectionDao.getAll()
    sqliteManager.requestDao.getById(0)
    sqliteManager.configDao.getById(0)
    sqliteManager.fileDao.getById(0)
    sqliteManager.jobScriptDao.getAll()
    sqliteManager.userDao.getById(0)

    // Tables to migrate
    val tables = listOf(
        "accesstokens",
        "certificatedb",
        "collections",
        "requests",
        "config",
        "file",
        "jobscript",
        "users"
    )

    // Get connections for direct SQL execution
    h2Manager.dataSource.connection.use { h2Conn ->
        sqliteManager.dataSource.connection.use { sqliteConn ->
            // Disable auto-commit for batch operations
            sqliteConn.autoCommit = false

            try {
                // Migrate each table
                for (table in tables) {
                    migrateTable(h2Conn, sqliteConn, table)
                }

                // Commit all changes
                sqliteConn.commit()
                log.info("Migration completed successfully")
            } catch (e: Exception) {
                // Rollback on error
                sqliteConn.rollback()
                log.error("Migration failed", e)
                throw e
            } finally {
                // Reset autocommit
                sqliteConn.autoCommit = true
            }
        }
    }

    h2Manager.dataSource.close()
    sqliteManager.dataSource.close()
    log.info("Migration complete")
}

private fun migrateTable(
    h2Conn: java.sql.Connection,
    sqliteConn: java.sql.Connection,
    tableName: String
) {
    log.info("Migrating table: $tableName")
    val statement = h2Conn.createStatement()
    val resultSet = statement.executeQuery("SELECT * FROM $tableName")
    val metaData = resultSet.metaData
    val columnCount = metaData.columnCount

    // Generate column names and placeholder string for the prepared statement
    val columnNames = ArrayList<String>(columnCount)
    val placeholders = StringBuilder()

    for (i in 1..columnCount) {
        columnNames.add(metaData.getColumnName(i))
        placeholders.append("?")
        if (i < columnCount) {
            placeholders.append(",")
        }
    }

    // Build the SQL insert statement
    val insertSQL =
        "INSERT INTO $tableName (${columnNames.joinToString(",")}) VALUES ($placeholders)"
    val insertStatement = sqliteConn.prepareStatement(insertSQL)

    var count = 0
    // For each row in the result set
    while (resultSet.next()) {
        // Set parameters for each column
        for (i in 1..columnCount) {
            when (metaData.getColumnType(i)) {
                java.sql.Types.BLOB, java.sql.Types.BINARY, java.sql.Types.VARBINARY, java.sql.Types.LONGVARBINARY -> {
                    val bytes = resultSet.getBytes(i)
                    if (bytes == null) {
                        insertStatement.setNull(i, java.sql.Types.BLOB)
                    } else {
                        insertStatement.setBytes(i, bytes)
                    }
                }

                else -> {
                    val value = resultSet.getObject(i)
                    insertStatement.setObject(i, value)
                }
            }
        }

        insertStatement.executeUpdate()
        count++
    }

    resultSet.close()
    statement.close()
    insertStatement.close()

    log.info("Migrated $count records from table $tableName")
}
