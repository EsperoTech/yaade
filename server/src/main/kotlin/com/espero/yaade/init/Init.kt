package com.espero.yaade.init

import com.espero.yaade.db.DaoManager
import com.j256.ormlite.jdbc.DataSourceConnectionSource
import com.j256.ormlite.support.ConnectionSource
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource

fun createDaoManager(jdbcUrl: String, jdbcUser: String, jdbcPwd: String): DaoManager {
    val connectionSource = createConnectionSource(jdbcUrl, jdbcUser, jdbcPwd)
    return DaoManager(connectionSource)
}

fun createConnectionSource(jdbcUrl: String, jdbcUser: String, jdbcPwd: String): ConnectionSource {
    val hikariConfig = createHikariConfig(jdbcUrl, jdbcUser, jdbcPwd)
    val ds = HikariDataSource(hikariConfig)
    return DataSourceConnectionSource(ds, jdbcUrl)
}

fun createHikariConfig(jdbcUrl: String, jdbcUser: String, jdbcPwd: String): HikariConfig {
    val hikariConfig = HikariConfig()
    hikariConfig.jdbcUrl = jdbcUrl
    hikariConfig.username = jdbcUser
    hikariConfig.password = jdbcPwd
    hikariConfig.connectionTimeout = 3000
    return hikariConfig
}