package com.espero.yaade.server.errors

import com.espero.yaade.server.Server
import io.vertx.core.http.HttpMethod
import io.vertx.core.impl.logging.LoggerFactory
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.impl.Utils

import java.time.Clock
import kotlin.math.min

private val log = LoggerFactory.getLogger(Server::class.java)

data class ServerError(val code: Int, override val message: String) : RuntimeException(message)

fun handleFailure(ctx: RoutingContext) {
    val error = ctx.failure()

    if (error != null && error is ServerError) {
        // NOTE: do not log still-alive requests to the server
        if (!(ctx.request().path() == "/api/user" && ctx.request().method() == HttpMethod.GET)) {
            logServerError(ctx, error.code, error.message, true)
        }
        ctx.response().statusCode = error.code
        ctx.response().end(
            JsonObject()
                .put("status", error.code)
                .put("message", error.message)
                .encode()
        )
        return
    }

    error.printStackTrace()
    logServerError(ctx, 500, error.message ?: "An unknown error occured", false)
    val resp = ServerError(
        500, error.message?.substring(0, min(error?.message?.length ?: 0, 50))
            ?: "An unknown error occured"
    )
    ctx.response().statusCode = resp.code
    ctx.response().end(JsonObject.mapFrom(resp).encode())
}

fun logServerError(ctx: RoutingContext, code: Int, message: String, logWarn: Boolean) {
    val headers = ctx.request().headers()
    val referrer: String =
        if (headers.contains("referrer")) headers.get("referrer") else headers.get("referer") ?: ""
    val userAgent: String = headers.get("user-agent") ?: ""
    val logMsg = String.format(
        "[%s] \"%s %s %s\" %s %s \"%s\" \"%s\"",
        Utils.formatRFC1123DateTime(Clock.systemUTC().millis()),
        ctx.request().method(),
        ctx.request().uri(),
        ctx.request().version(),
        code,
        message,
        referrer,
        userAgent
    )
    if (logWarn)
        log.warn(logMsg)
    else
        log.error(logMsg)
}
