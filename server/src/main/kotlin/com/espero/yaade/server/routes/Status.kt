package com.espero.yaade.server.routes

import io.vertx.ext.web.RoutingContext
import io.vertx.kotlin.core.json.json
import io.vertx.kotlin.core.json.obj

fun health(ctx: RoutingContext) {
    ctx.json(
        json {
            obj(
                "status" to "ok",
                "version" to "v1"
            )
        }
    )
}
