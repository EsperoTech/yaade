package com.espero.yaade.server.utils

import io.vertx.core.Handler
import io.vertx.ext.web.Route
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.openapi.Operation
import io.vertx.kotlin.coroutines.CoroutineVerticle
import kotlinx.coroutines.launch

fun Operation.coroutineHandler(coroutineVerticle: CoroutineVerticle, handler: Handler<RoutingContext>) {
    this.handler { ctx ->
        coroutineVerticle.launch {
            try {
                handler.handle(ctx)
            } catch (t: Throwable) {
                t.printStackTrace()
                ctx.fail(500)
            }
        }
    }
}

fun Operation.authorizedCoroutineHandler(
    coroutineVerticle: CoroutineVerticle,
    handler: suspend (ctx: RoutingContext) -> Unit
) {
    this.handler { ctx ->
        if (ctx.user() == null) {
            ctx.fail(403)
            return@handler
        }
        coroutineVerticle.launch {
            try {
                handler(ctx)
            } catch (t: Throwable) {
                t.printStackTrace()
                ctx.fail(500)
            }
        }
    }
}

fun Route.coroutineHandler(coroutineVerticle: CoroutineVerticle, handler: Handler<RoutingContext>) {
    this.handler { ctx ->
        coroutineVerticle.launch {
            try {
                handler.handle(ctx)
            } catch (t: Throwable) {
                t.printStackTrace()
                ctx.fail(500)
            }
        }
    }
}
