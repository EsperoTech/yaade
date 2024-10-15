package com.espero.yaade.server.utils

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.errors.ServerError
import com.fasterxml.jackson.core.StreamReadConstraints
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.core.Handler
import io.vertx.core.Vertx
import io.vertx.core.json.jackson.DatabindCodec
import io.vertx.ext.auth.User
import io.vertx.ext.web.Route
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.openapi.Operation
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait
import kotlinx.coroutines.launch
import java.security.MessageDigest

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

fun Operation.tokenCoroutineHandler(
    coroutineVerticle: CoroutineVerticle,
    daoManager: DaoManager,
    handler: suspend (ctx: RoutingContext) -> Unit
) {
    this.handler { ctx ->
        val token = ctx.request().getHeader("Authorization")?.replace("Bearer ", "")
            ?: throw ServerError(HttpResponseStatus.UNAUTHORIZED.code(), "No token provided")
        val hashedSecret = hashWithSHA256(token)
        val accessToken = daoManager.accessTokenDao.getByHashedSecret(hashedSecret)
            ?: throw ServerError(HttpResponseStatus.UNAUTHORIZED.code(), "Invalid token")
        val user = daoManager.userDao.getById(accessToken.ownerId)
            ?: throw ServerError(HttpResponseStatus.UNAUTHORIZED.code(), "Invalid token")
        ctx.setUser(user.toSessionUser())
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

fun configureDatabindCodec() {
    // we do not limit the length of strings for now
    // this might become a performance problem later on
    val s = StreamReadConstraints
        .builder()
        .maxStringLength(Integer.MAX_VALUE)
        .build()
    DatabindCodec.mapper().factory.setStreamReadConstraints(s)
    DatabindCodec.prettyMapper().factory.setStreamReadConstraints(s)
}

suspend fun <T : Any> Vertx.awaitBlocking(block: () -> T): T {
    return this.executeBlocking(block).coAwait()
}

fun hashWithSHA256(input: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val hashBytes = digest.digest(input.toByteArray())
    return hashBytes.joinToString("") { "%02x".format(it) }
}
