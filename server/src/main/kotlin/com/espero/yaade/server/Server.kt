package com.espero.yaade.server

import com.espero.yaade.db.DaoManager
import com.espero.yaade.server.routes.CollectionRoute
import com.espero.yaade.server.routes.RequestRoute
import com.espero.yaade.server.routes.UserRoute
import com.espero.yaade.server.routes.health
import com.espero.yaade.server.utils.authorizedCoroutineHandler
import com.espero.yaade.server.utils.coroutineHandler
import io.vertx.ext.web.handler.*
import io.vertx.ext.web.openapi.RouterBuilder
import io.vertx.ext.web.sstore.LocalSessionStore
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.await
import org.slf4j.LoggerFactory


class Server(private val port: Int, private val daoManager: DaoManager) : CoroutineVerticle() {
    private val log = LoggerFactory.getLogger(Server::class.java)

    override suspend fun start() {
        try {
            val collectionRoute = CollectionRoute(daoManager, vertx)
            val requestRoute = RequestRoute(daoManager)
            val userRoute = UserRoute(daoManager, vertx)

            val store = LocalSessionStore.create(vertx)
            val provider = LocalAuthProvider(daoManager)
            val routerBuilder = RouterBuilder.create(vertx, "openapi.yaml").await()

            routerBuilder.bodyHandler(BodyHandler.create().setUploadsDirectory("/tmp"))
            routerBuilder.rootHandler(SessionHandler.create(store))

            routerBuilder.operation("health").coroutineHandler(this, ::health)

            routerBuilder.operation("doLogin").coroutineHandler(this, AuthHandler(provider))
            routerBuilder.operation("doLogout").coroutineHandler(this, userRoute::logout)

            routerBuilder.operation("getCurrentUser")
                .authorizedCoroutineHandler(this, userRoute::getCurrentUser)
            routerBuilder.operation("changeUserPassword")
                .authorizedCoroutineHandler(this, userRoute::changePassword)
            routerBuilder.operation("exportBackup")
                .authorizedCoroutineHandler(this, userRoute::exportBackup)
            routerBuilder.operation("importBackup")
                .authorizedCoroutineHandler(this, userRoute::importBackup)
            routerBuilder.operation("changeSetting")
                .authorizedCoroutineHandler(this, userRoute::changeSetting)

            routerBuilder.operation("getAllCollections")
                .authorizedCoroutineHandler(this, collectionRoute::getAllCollections)
            routerBuilder.operation("postCollection")
                .authorizedCoroutineHandler(this, collectionRoute::postCollection)
            routerBuilder.operation("putCollection")
                .authorizedCoroutineHandler(this, collectionRoute::putCollection)
            routerBuilder.operation("deleteCollection")
                .authorizedCoroutineHandler(this, collectionRoute::deleteCollection)
            routerBuilder.operation("importOpenApi")
                .authorizedCoroutineHandler(this, collectionRoute::importOpenApiCollection)

            routerBuilder.operation("postRequest")
                .authorizedCoroutineHandler(this, requestRoute::postRequest)
            routerBuilder.operation("putRequest")
                .authorizedCoroutineHandler(this, requestRoute::putRequest)
            routerBuilder.operation("deleteRequest")
                .authorizedCoroutineHandler(this, requestRoute::deleteRequest)

            val router = routerBuilder.rootHandler(LoggerHandler.create(LoggerFormat.DEFAULT)).createRouter()
            router.route("/*").coroutineHandler(this, StaticHandler.create())

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
