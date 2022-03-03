package server

import io.vertx.core.eventbus.EventBus
import io.vertx.core.eventbus.Message
import io.vertx.ext.web.Route
import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.coroutines.CoroutineVerticle
import kotlinx.coroutines.launch

fun <T> EventBus.coroutineConsumer(
    coroutineVerticle: CoroutineVerticle,
    address: String,
    handler: suspend (msg: Message<T>) -> Unit
) {
    this.consumer<T>(address) { message -> coroutineVerticle.launch { handler(message) } }
}

fun Route.coroutineHandler(coroutineVerticle: CoroutineVerticle, handler: suspend (ctx: RoutingContext) -> Unit) {
    this.handler { ctx -> coroutineVerticle.launch { handler(ctx) } }
}