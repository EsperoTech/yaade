package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import io.vertx.core.json.JsonArray
import io.vertx.ext.web.RoutingContext

class CollectionRoute(private val daoManager: DaoManager) {

    fun getAllCollections(ctx: RoutingContext) {
        try {
            val collections = daoManager.collectionDao.getAll().map {
                val requests = daoManager.requestDao.getAllInCollection(it.id).map(RequestDb::toJson)
                it.toJson().put("requests", requests)
            }

            ctx.end(JsonArray(collections).encode())
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun postCollection(ctx: RoutingContext) {
        try {
            val request = ctx.bodyAsJson
            val newCollection = CollectionDb(request.getString("name"))

            daoManager.collectionDao.create(newCollection)

            ctx.end(newCollection.toJson().encode())
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

}
