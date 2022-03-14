package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.j256.ormlite.misc.TransactionManager
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
            val userId = ctx.user().principal().getLong("id")
            val newCollection = CollectionDb(request.getString("name"), userId)

            daoManager.collectionDao.create(newCollection)

            ctx.end(newCollection.toJson().put("requests", JsonArray()).encode())
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun putCollection(ctx: RoutingContext) {
        try {
            val newCollection = CollectionDb.fromUpdateRequest(ctx.bodyAsJson)
            daoManager.collectionDao.update(newCollection)
            ctx.end()
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun deleteCollection(ctx: RoutingContext) {
        try {
            val id = ctx.pathParam("id")

            TransactionManager.callInTransaction(daoManager.connectionSource) {
                daoManager.collectionDao.delete(id)
                daoManager.requestDao.deleteAllInCollection(id)
            }

            daoManager.collectionDao.delete(id)
            ctx.end()
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

}
