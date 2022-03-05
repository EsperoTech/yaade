package com.espero.yaade.server.utils

import io.vertx.core.Handler
import io.vertx.ext.web.Route
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.openapi.Operation
import io.vertx.kotlin.coroutines.CoroutineVerticle
import kotlinx.coroutines.launch

fun Operation.coroutineHandler(coroutineVerticle: CoroutineVerticle, handler: Handler<RoutingContext>) {
    this.handler { ctx -> coroutineVerticle.launch { handler.handle(ctx) } }
}

fun Route.coroutineHandler(coroutineVerticle: CoroutineVerticle, handler: Handler<RoutingContext>) {
    this.handler { ctx -> coroutineVerticle.launch { handler.handle(ctx) } }
}