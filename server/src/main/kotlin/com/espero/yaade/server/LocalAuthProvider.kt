package com.espero.yaade.server

import com.espero.yaade.db.DaoManager
import com.password4j.Password
import io.vertx.core.AsyncResult
import io.vertx.core.Future
import io.vertx.core.Handler
import io.vertx.core.Vertx
import io.vertx.core.json.JsonObject
import io.vertx.ext.auth.User
import io.vertx.ext.auth.authentication.AuthenticationProvider

class LocalAuthProvider(private val daoManager: DaoManager) : AuthenticationProvider {
    override fun authenticate(credentials: JsonObject, resultHandler: Handler<AsyncResult<User>>) {
        try {
            val username = credentials.getString("username") ?: throw RuntimeException("Username must be set")
            val password = credentials.getString("password") ?: throw RuntimeException("Password must be set")
            val user = daoManager.userDao.getByUsername(username) ?: throw RuntimeException("No user found")
            if (!Password.check(password, user.password).withArgon2()) {
                throw RuntimeException("Password does not match")
            }
            val sessionUser = User.fromName(username)
            sessionUser.principal().put("id", user.id)
            resultHandler.handle(Future.succeededFuture(sessionUser))
        } catch (t: Throwable) {
            resultHandler.handle(Future.failedFuture(t))
        }
    }
}