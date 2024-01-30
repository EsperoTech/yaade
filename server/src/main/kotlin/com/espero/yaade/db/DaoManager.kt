package com.espero.yaade.db

import com.j256.ormlite.jdbc.DataSourceConnectionSource
import com.j256.ormlite.support.ConnectionSource
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource

class DaoManager {

    lateinit var requestDao: RequestDao
    lateinit var collectionDao: CollectionDao
    lateinit var userDao: UserDao
    lateinit var configDao: ConfigDao
    lateinit var dataSource: HikariDataSource
    lateinit var connectionSource: ConnectionSource

    fun init(jdbcUrl: String, jdbcUsr: String, jdbcPwd: String) {
        val hikariConfig = HikariConfig()
        hikariConfig.jdbcUrl = jdbcUrl
        hikariConfig.username = jdbcUsr
        hikariConfig.password = jdbcPwd
        hikariConfig.connectionTimeout = 3000
        dataSource = HikariDataSource(hikariConfig)
        connectionSource = DataSourceConnectionSource(dataSource, jdbcUrl)
        requestDao = RequestDao(connectionSource)
        collectionDao = CollectionDao(connectionSource)
        userDao = UserDao(connectionSource)
        configDao = ConfigDao(connectionSource)
    }

    fun close() {
        com.j256.ormlite.dao.DaoManager.clearCache()
        connectionSource.close()
        dataSource.close()
    }
}
