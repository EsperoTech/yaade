package com.espero.yaade.db

import com.j256.ormlite.support.ConnectionSource
import com.zaxxer.hikari.HikariDataSource

class DaoManager {
    lateinit var requestDao: RequestDao
    lateinit var collectionDao: CollectionDao
    lateinit var userDao: UserDao
    lateinit var dataSource: HikariDataSource
    lateinit var connectionSource: ConnectionSource

    fun init(dataSource: HikariDataSource, connectionSource: ConnectionSource) {
        this.dataSource = dataSource
        this.connectionSource = connectionSource
        requestDao = RequestDao(connectionSource)
        collectionDao = CollectionDao(connectionSource)
        userDao = UserDao(connectionSource)
    }
}