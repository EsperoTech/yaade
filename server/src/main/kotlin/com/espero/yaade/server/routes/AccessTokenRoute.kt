package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.AccessTokenDb
import com.espero.yaade.server.utils.hashWithSHA256
import io.vertx.core.json.JsonArray
import io.vertx.ext.web.RoutingContext

class AccessTokenRoute(private val daoManager: DaoManager) {

    fun createAccessToken(ctx: RoutingContext) {
        val userId = ctx.user().principal().getLong("id")
        val data = ctx.body().asJsonObject()
        val rawSecret = "yaade_${generateSecret()}"
        val secret = hashWithSHA256(rawSecret)
        val newAccessToken = AccessTokenDb(secret, userId, data)
        daoManager.accessTokenDao.create(newAccessToken)
        ctx.end(newAccessToken.toJson().put("secret", rawSecret).encode())
    }

    fun listUserAccessTokens(ctx: RoutingContext) {
        val userId = ctx.user().principal().getLong("id")
        val accessTokens = daoManager.accessTokenDao.getByOwnerId(userId)
        ctx.end(JsonArray(accessTokens.map { it.toJson() }).encode())
    }

    fun deleteAccessToken(ctx: RoutingContext) {
        val userId = ctx.user().principal().getLong("id")
        val publicId = ctx.pathParam("id").toString()
        val accessToken = daoManager.accessTokenDao.getByPublicId(publicId)
        if (accessToken == null || accessToken.ownerId != userId) {
            throw RuntimeException("No access token found for id $publicId")
        }
        daoManager.accessTokenDao.delete(accessToken.id)
        ctx.end()
    }

    private fun generateSecret(): String {
        val chars = ('A'..'Z') + ('a'..'z') + ('0'..'9')
        return List(32) { chars.random() }.joinToString("")
    }
}
