package com.espero.yaade

import com.espero.yaade.init.createDaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.ConfigDb
import com.espero.yaade.server.Server
import io.vertx.core.Vertx
import io.vertx.core.json.JsonObject

val PORT = System.getenv("YAADE_PORT")?.toInt() ?: 9339
val JDBC_URL = System.getenv("YAADE_JDBC_URL") ?: "jdbc:h2:file:./app/data/yaade-db"
val JDBC_USR = System.getenv("YAADE_JDBC_USERNAME") ?: "sa"
val JDBC_PWD = System.getenv("YAADE_JDBC_PASSWORD") ?: ""
val ADMIN_USERNAME: String = System.getenv("YAADE_ADMIN_USERNAME") ?: ""
val BASE_PATH: String = System.getenv("YAADE_BASE_PATH") ?: ""

fun main() {
    val daoManager = createDaoManager(JDBC_URL, JDBC_USR, JDBC_PWD)
    val vertx = Vertx.vertx()
    vertx.deployVerticle(Server(PORT, daoManager))
}

