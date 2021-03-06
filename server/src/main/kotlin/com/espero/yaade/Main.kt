package com.espero.yaade

import com.espero.yaade.init.createDaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.server.Server
import io.vertx.core.Vertx
import io.vertx.core.json.JsonObject

const val PORT = 9339
const val JDBC_URL = "jdbc:h2:file:./app/data/yaade-db"
const val JDBC_USR = "sa"
const val JDBC_PWD = ""
val ADMIN_USERNAME: String = System.getenv("YAADE_ADMIN_USERNAME")

fun main() {
    val daoManager = createDaoManager(JDBC_URL, JDBC_USR, JDBC_PWD)

    val admin = daoManager.userDao.getByUsername(ADMIN_USERNAME)

    if (admin == null) {
        val adminUser = daoManager.userDao.createUser(ADMIN_USERNAME, listOf("admin"))
        val data = JsonObject().put("name", "Collection").put("groups", listOf("admin"))
        val collection = CollectionDb(data, adminUser.id)
        daoManager.collectionDao.create(collection)
    } else {
        if (!admin.groups().contains("admin")) {
            admin.setGroups(setOf("admin"))
            daoManager.userDao.update(admin)
        }
    }

    val vertx = Vertx.vertx()

    vertx.deployVerticle(Server(PORT, daoManager))
}
