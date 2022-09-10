package com.espero.yaade.server.auth

import io.vertx.core.AsyncResult
import io.vertx.core.Future
import io.vertx.core.Handler
import io.vertx.ext.auth.User
import io.vertx.ext.auth.authentication.AuthenticationProvider
import io.vertx.ext.auth.authentication.UsernamePasswordCredentials
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.handler.HttpException
import io.vertx.ext.web.handler.impl.AuthenticationHandlerImpl

class LocalAuthHandler(authProvider: AuthenticationProvider) :
    AuthenticationHandlerImpl<AuthenticationProvider>(authProvider) {
    override fun authenticate(ctx: RoutingContext, handler: Handler<AsyncResult<User>>) {
        try {
            val username = ctx.body().asJsonObject().getString("username")
            val password = ctx.body().asJsonObject().getString("password")

            if (username == null || password == null) {
                handler.handle(Future.failedFuture(HttpException(400)))
            }

            authProvider.authenticate(UsernamePasswordCredentials(username, password)) { authn ->
                if (authn.failed()) {
                    handler.handle(Future.failedFuture(HttpException(401, authn.cause())))
                } else {
                    handler.handle(authn)
                }
            }
        } catch (t: Throwable) {
            handler.handle(Future.failedFuture(HttpException(500, t)))
        }
    }

    override fun postAuthentication(ctx: RoutingContext) {
        val user = ctx.user()
        ctx.end(user.principal().encode())
    }
}
