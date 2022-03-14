package com.espero.yaade

import com.espero.yaade.init.createDaoManager
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.Server
import com.password4j.Password
import io.vertx.core.Vertx

const val PORT = 9339
const val JDBC_URL = "jdbc:h2:file:./yaade-db"
const val JDBC_USR = "sa"
const val JDBC_PWD = ""
const val ADMIN_USERNAME = "joro"
const val ADMIN_PASSWORD = "password"

fun main() {
    val daoManager = createDaoManager(JDBC_URL, JDBC_USR, JDBC_PWD)

    if (daoManager.userDao.getByUsername(ADMIN_USERNAME) == null) {
        val hashedPassword = Password.hash(ADMIN_PASSWORD).addRandomSalt().withArgon2().result
        val admin = UserDb(ADMIN_USERNAME, hashedPassword)
        daoManager.userDao.create(admin)
    }

    val vertx = Vertx.vertx()

    vertx.deployVerticle(Server(PORT, daoManager))
}