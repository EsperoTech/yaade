package com.espero.yaade.server

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.routes.AdminRoute
import com.espero.yaade.server.routes.CollectionRoute
import com.espero.yaade.server.routes.RequestRoute
import com.espero.yaade.server.routes.UserRoute
import com.espero.yaade.server.routes.health
import com.espero.yaade.server.utils.adminCoroutineHandler
import com.espero.yaade.server.utils.coroutineHandler
import com.espero.yaade.server.utils.userCoroutineHandler
import io.vertx.ext.web.handler.BodyHandler
import io.vertx.ext.web.handler.ErrorHandler
import io.vertx.ext.web.handler.LoggerFormat
import io.vertx.ext.web.handler.LoggerHandler
import io.vertx.ext.web.handler.SessionHandler
import io.vertx.ext.web.handler.StaticHandler
import io.vertx.ext.web.openapi.RouterBuilder
import io.vertx.ext.web.sstore.LocalSessionStore
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.await
import org.slf4j.LoggerFactory

class Server(private val port: Int, private val daoManager: DaoManager) : CoroutineVerticle() {
    private val log = LoggerFactory.getLogger(Server::class.java)
    private val sessionTimeout: Long = 6 * 60 * 60 * 1000L

    override suspend fun start() {
        try {
            val collectionRoute = CollectionRoute(daoManager, vertx)
            val requestRoute = RequestRoute(daoManager)
            val userRoute = UserRoute(daoManager, vertx)
            val adminRoute = AdminRoute(daoManager, vertx)

            val store = LocalSessionStore.create(vertx)
            val provider = LocalAuthProvider(daoManager)
            val routerBuilder = RouterBuilder.create(vertx, "openapi.yaml").await()
            routerBuilder.rootHandler(LoggerHandler.create(LoggerFormat.DEFAULT))
            routerBuilder.rootHandler(SessionHandler.create(store).setSessionTimeout(sessionTimeout))
            routerBuilder.rootHandler(BodyHandler.create().setUploadsDirectory("/tmp"))

            routerBuilder.operation("health").coroutineHandler(this, ::health)

            routerBuilder.operation("doLogin").coroutineHandler(this, AuthHandler(provider))
            routerBuilder.operation("doLogout").coroutineHandler(this, userRoute::logout)

            routerBuilder.operation("getCurrentUser")
                .userCoroutineHandler(this, userRoute::getCurrentUser)
            routerBuilder.operation("changeUserPassword")
                .userCoroutineHandler(this, userRoute::changePassword)
            routerBuilder.operation("changeSetting")
                .userCoroutineHandler(this, userRoute::changeSetting)

            routerBuilder.operation("getAllCollections")
                .userCoroutineHandler(this, collectionRoute::getAllCollections)
            routerBuilder.operation("postCollection")
                .userCoroutineHandler(this, collectionRoute::postCollection)
            routerBuilder.operation("putCollection")
                .userCoroutineHandler(this, collectionRoute::putCollection)
            routerBuilder.operation("deleteCollection")
                .userCoroutineHandler(this, collectionRoute::deleteCollection)
            routerBuilder.operation("importOpenApi")
                .userCoroutineHandler(this, collectionRoute::importOpenApiCollection)

            routerBuilder.operation("postRequest")
                .userCoroutineHandler(this, requestRoute::postRequest)
            routerBuilder.operation("putRequest")
                .userCoroutineHandler(this, requestRoute::putRequest)
            routerBuilder.operation("deleteRequest")
                .userCoroutineHandler(this, requestRoute::deleteRequest)

            routerBuilder.operation("exportBackup")
                .adminCoroutineHandler(this, adminRoute::exportBackup)
            routerBuilder.operation("importBackup")
                .adminCoroutineHandler(this, adminRoute::importBackup)
            routerBuilder.operation("createUser")
                .adminCoroutineHandler(this, adminRoute::createUser)
            routerBuilder.operation("updateUser")
                .adminCoroutineHandler(this, adminRoute::updateUser)
            routerBuilder.operation("deleteUser")
                .adminCoroutineHandler(this, adminRoute::deleteUser)
            routerBuilder.operation("resetUserPassword")
                .adminCoroutineHandler(this, adminRoute::resetUserPassword)
            routerBuilder.operation("getUsers")
                .adminCoroutineHandler(this, adminRoute::getUsers)

            val router = routerBuilder.createRouter()
            router.route("/*").coroutineHandler(this, StaticHandler.create())

            router.errorHandler(
                500,
                ErrorHandler { ctx ->
                    println("500: ${ctx.failure().message}")
                    ctx.response().setStatusCode(500).end(ctx.failure().message)
                }
            )
            val server = vertx.createHttpServer()
                .requestHandler(router)
                .listen(port)
                .await()
            log.info("Started server on port ${server.actualPort()}")
        } catch (t: Throwable) {
            log.error("Could not start server", t)
        }
    }
}
