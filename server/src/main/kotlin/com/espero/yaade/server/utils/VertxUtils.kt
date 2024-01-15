package com.espero.yaade.server.utils

import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Handler
import io.vertx.ext.auth.User
import io.vertx.ext.web.Route
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.openapi.Operation
import io.vertx.kotlin.coroutines.CoroutineVerticle
import kotlinx.coroutines.launch

fun Operation.coroutineHandler(
    coroutineVerticle: CoroutineVerticle,
    handler: Handler<RoutingContext>
) {
    this.handler { ctx ->
        coroutineVerticle.launch {
            try {
                handler.handle(ctx)
            } catch (t: Throwable) {
                ctx.fail(t)
            }
        }
    }
}

fun isUserAdmin(user: User): Boolean {
    try {
        return user.principal().getJsonObject("data").getJsonArray("groups").contains("admin")
    } catch (e: Exception) {
        e.printStackTrace()
    }
    return false
}

fun Operation.authorizedCoroutineHandler(
    coroutineVerticle: CoroutineVerticle,
    isAdminHandler: Boolean,
    handler: suspend (ctx: RoutingContext) -> Unit
) {
    this.handler { ctx ->
        if (ctx.user() == null) {
            ctx.fail(ServerError(HttpResponseStatus.UNAUTHORIZED.code(), "Not logged in"))
            return@handler
        }
        if (isAdminHandler && !isUserAdmin(ctx.user())) {
            ctx.fail(ServerError(HttpResponseStatus.UNAUTHORIZED.code(), "User is not admin"))
            return@handler
        }
        coroutineVerticle.launch {
            try {
                handler(ctx)
            } catch (t: Throwable) {
                t.printStackTrace()
                ctx.fail(t)
            }
        }
    }
}

fun Operation.adminCoroutineHandler(
    coroutineVerticle: CoroutineVerticle,
    handler: suspend (ctx: RoutingContext) -> Unit
) {
    authorizedCoroutineHandler(coroutineVerticle, true, handler)
}

fun Operation.userCoroutineHandler(
    coroutineVerticle: CoroutineVerticle,
    handler: suspend (ctx: RoutingContext) -> Unit
) {
    authorizedCoroutineHandler(coroutineVerticle, false, handler)
}

fun Route.coroutineHandler(coroutineVerticle: CoroutineVerticle, handler: Handler<RoutingContext>) {
    this.handler { ctx ->
        coroutineVerticle.launch {
            try {
                handler.handle(ctx)
            } catch (t: Throwable) {
                t.printStackTrace()
                ctx.fail(t)
            }
        }
    }
}
