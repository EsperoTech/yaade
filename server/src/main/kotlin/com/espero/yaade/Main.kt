package com.espero.yaade

import com.espero.yaade.init.createDaoManager
import com.espero.yaade.server.Server
import io.vertx.core.Vertx

const val PORT = 9339
const val JDBC_URL = "jdbc:h2:file:./yaade-db"
const val JDBC_USR = "sa"
const val JDBC_PWD = ""

fun main() {
    val daoManager = createDaoManager(JDBC_URL, JDBC_USR, JDBC_PWD)
    val vertx = Vertx.vertx()

    vertx.deployVerticle(Server(PORT, daoManager))
}