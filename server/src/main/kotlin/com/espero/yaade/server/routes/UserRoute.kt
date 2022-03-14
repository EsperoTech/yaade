package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.password4j.Password
import io.vertx.ext.web.RoutingContext

class UserRoute(private val daoManager: DaoManager) {
    fun getCurrentUser(ctx: RoutingContext) {
        val user = ctx.user()
        ctx.end(user.principal().encode())
    }

    fun logout(ctx: RoutingContext) {
        ctx.session().destroy()
        ctx.end()
    }

    fun changePassword(ctx: RoutingContext) {
        val newPassword = ctx.bodyAsJson.getString("newPassword")
        val currentPassword = ctx.bodyAsJson.getString("currentPassword")
        val userId = ctx.user().principal().getString("id")

        val user = daoManager.userDao.getById(userId)

        if (!Password.check(currentPassword, user.password).withArgon2()) {
            ctx.fail(403)
        }

        user.password = Password.hash(newPassword).addRandomSalt().withArgon2().result

        daoManager.userDao.update(user)

        ctx.end()


    }
}