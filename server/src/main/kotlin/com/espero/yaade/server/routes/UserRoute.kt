package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.errors.ServerError
import com.password4j.Password
import io.vertx.core.Vertx
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.await
import org.apache.http.HttpStatus

class UserRoute(private val daoManager: DaoManager, private val vertx: Vertx) {
    suspend fun getCurrentUser(ctx: RoutingContext) {
        val user = ctx.user()
        ctx.end(user.principal().encode()).await()
    }

    fun logout(ctx: RoutingContext) {
        ctx.session().destroy()
        ctx.end()
    }

    suspend fun changePassword(ctx: RoutingContext) {
        val newPassword = ctx.body().asJsonObject().getString("newPassword")
        val currentPassword = ctx.body().asJsonObject().getString("currentPassword")
        val userId = ctx.user().principal().getLong("id")

        val user = daoManager.userDao.getById(userId)

        if (user == null || !Password.check(currentPassword, user.password).withArgon2()) {
            throw ServerError(HttpStatus.SC_FORBIDDEN, "Wrong current password")
        }

        user.password = Password.hash(newPassword).addRandomSalt().withArgon2().result

        daoManager.userDao.update(user)

        ctx.session().destroy()
        ctx.end().await()
    }

    suspend fun changeSetting(ctx: RoutingContext) {
        val userId = ctx.user().principal().getString("id").toLong()
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpStatus.SC_FORBIDDEN, "User does not exist")

        val body = ctx.body().asJsonObject()
        user.changeSetting(body.getString("key"), body.getValue("value"))
        daoManager.userDao.update(user)
        ctx.user().principal().put("data", user.jsonData())
        ctx.response().end().await()
    }
}
