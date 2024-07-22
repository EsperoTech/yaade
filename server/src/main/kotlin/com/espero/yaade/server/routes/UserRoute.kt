package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.errors.ServerError
import com.password4j.Password
import io.netty.handler.codec.http.HttpResponseStatus
import io.netty.handler.codec.http.QueryStringDecoder
import io.vertx.core.MultiMap
import io.vertx.core.Vertx
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.client.WebClient
import io.vertx.kotlin.coroutines.coAwait

class UserRoute(private val daoManager: DaoManager, private val vertx: Vertx) {

    suspend fun getCurrentUser(ctx: RoutingContext) {
        val user = ctx.user()
        ctx.end(user.principal().encode()).coAwait()
    }

    fun logout(ctx: RoutingContext) {
        ctx.session().destroy()
        ctx.end()
    }

    suspend fun changePassword(ctx: RoutingContext) {
        val newPassword = ctx.body().asJsonObject().getString("newPassword")
        val currentPassword = ctx.body().asJsonObject().getString("currentPassword")
        val userId = ctx.user().principal().getLong("id")

        val user = daoManager.userDao.getById(userId)

        if (user == null || !Password.check(currentPassword, user.password).withArgon2()) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "Wrong current password")
        }

        user.password = Password.hash(newPassword).addRandomSalt().withArgon2().result

        daoManager.userDao.update(user)

        ctx.session().destroy()
        ctx.end().coAwait()
    }

    suspend fun changeSetting(ctx: RoutingContext) {
        val userId = ctx.user().principal().getString("id").toLong()
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User does not exist")

        val body = ctx.body().asJsonObject()
        user.changeSetting(body.getString("key"), body.getValue("value"))
        daoManager.userDao.update(user)
        ctx.user().principal().put("data", user.jsonData())
        ctx.response().end().coAwait()
    }

    suspend fun exchangeOAuth2Code(ctx: RoutingContext) {
        val body = ctx.body().asJsonObject()

        val tokenUrl = body.getString("tokenUrl") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No tokenUrl provided"
        )
        val data = body.getString("data") ?: throw ServerError(
            HttpResponseStatus.BAD_REQUEST.code(),
            "No code provided"
        )
        val decoder = QueryStringDecoder("?$data", false)
        val params = MultiMap.caseInsensitiveMultiMap()
        decoder.parameters().forEach { (key: String?, values: List<String?>?) ->
            params.add(
                key,
                values
            )
        }

        val httpClient = WebClient.create(vertx)
        
        val response = httpClient.postAbs(tokenUrl).sendForm(params).coAwait()

        if (response.statusCode() != 200) {
            throw ServerError(
                response.statusCode(),
                "Error while exchanging code: ${response.bodyAsString()}"
            )
        }

        val responseBody = response.bodyAsString()
        val encodedResponse = try {
            JsonObject(responseBody).encode()
        } catch (e: Exception) {
            val query = QueryStringDecoder(responseBody, false).parameters()
            val res = JsonObject()
            for (entry in query) {
                res.put(entry.key, entry.value[0])
            }
            res.encode()
        }

        ctx.end(encodedResponse).coAwait()
    }
}
