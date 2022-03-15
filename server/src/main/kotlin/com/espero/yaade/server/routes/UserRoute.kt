package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.RequestDb
import com.password4j.Password
import io.vertx.core.http.HttpHeaders
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
        try {
            val newPassword = ctx.bodyAsJson.getString("newPassword")
            val currentPassword = ctx.bodyAsJson.getString("currentPassword")
            val userId = ctx.user().principal().getString("id")

            val user = daoManager.userDao.getById(userId)

            if (!Password.check(currentPassword, user.password).withArgon2()) {
                ctx.fail(403)
            }

            user.password = Password.hash(newPassword).addRandomSalt().withArgon2().result

            daoManager.userDao.update(user)

            ctx.session().destroy()
            ctx.end()
        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }

    fun exportBackup(ctx: RoutingContext) {
        try {
            ctx.response()
                .putHeader("Content-Disposition", "attachment; filename=\"yaade-db.mv.db\"")
                .putHeader(HttpHeaders.TRANSFER_ENCODING, "chunked")
                .sendFile("/app/data/yaade-db.mv.db")

        } catch (t: Throwable) {
            t.printStackTrace()
            ctx.fail(500)
        }
    }
}