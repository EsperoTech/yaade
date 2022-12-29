package com.espero.yaade

import com.espero.yaade.init.createDaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.ConfigDb
import com.espero.yaade.server.Server
import io.vertx.core.Vertx
import io.vertx.core.json.JsonObject

const val PORT = 9339
const val JDBC_URL = "jdbc:h2:file:./app/data/yaade-db"
const val JDBC_USR = "sa"
const val JDBC_PWD = ""
val ADMIN_USERNAME: String = System.getenv("YAADE_ADMIN_USERNAME") ?: ""
val BASE_PATH: String = System.getenv("YAADE_BASE_PATH") ?: ""

fun main() {
    val daoManager = createDaoManager(JDBC_URL, JDBC_USR, JDBC_PWD)
    val vertx = Vertx.vertx()
    vertx.deployVerticle(Server(PORT, daoManager))
}

