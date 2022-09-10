package com.espero.yaade.server

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.ConfigDb
import com.espero.yaade.server.auth.AuthHandler
import com.espero.yaade.server.errors.ServerError
import com.espero.yaade.server.errors.handleFailure
import com.espero.yaade.server.routes.AdminRoute
import com.espero.yaade.server.routes.CollectionRoute
import com.espero.yaade.server.routes.RequestRoute
import com.espero.yaade.server.routes.UserRoute
import com.espero.yaade.server.routes.health
import com.espero.yaade.server.utils.adminCoroutineHandler
import com.espero.yaade.server.utils.coroutineHandler
import com.espero.yaade.server.utils.userCoroutineHandler
import io.vertx.core.http.HttpMethod
import io.vertx.core.http.HttpServer
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.handler.BodyHandler
import io.vertx.ext.web.handler.ErrorHandler
import io.vertx.ext.web.handler.LoggerFormat
import io.vertx.ext.web.handler.LoggerHandler
import io.vertx.ext.web.handler.SessionHandler
import io.vertx.ext.web.handler.StaticHandler
import io.vertx.ext.web.openapi.RouterBuilder
import io.vertx.ext.web.sstore.LocalSessionStore
import io.vertx.ext.web.sstore.SessionStore
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.await
import org.slf4j.LoggerFactory

class Server(private val port: Int, private val daoManager: DaoManager) : CoroutineVerticle() {
    private val log = LoggerFactory.getLogger(Server::class.java)
    private val sessionTimeout: Long = 6 * 60 * 60 * 1000L

    var server: HttpServer? = null
    var sessionStore: SessionStore? = null

    public override suspend fun start() {
        restartServer()
    }

    suspend fun restartServer() {
        try {
            if (server != null) {
                log.info("Stopping server...")
                server!!.close().await()
                sessionStore!!.clear().await()
                sessionStore!!.close()
            }
            sessionStore = LocalSessionStore.create(vertx)
            val authHandler = AuthHandler(vertx, daoManager)

            val collectionRoute = CollectionRoute(daoManager, vertx)
            val requestRoute = RequestRoute(daoManager)
            val userRoute = UserRoute(daoManager, vertx)
            val adminRoute = AdminRoute(daoManager, vertx, authHandler::testAuthConfig, this)

            val routerBuilder = RouterBuilder.create(vertx, "openapi.yaml").await()

            routerBuilder.rootHandler(SessionHandler.create(sessionStore).setSessionTimeout(sessionTimeout))
            routerBuilder.rootHandler(BodyHandler.create().setUploadsDirectory("/tmp"))
            val loggerHandler = LoggerHandler.create(LoggerFormat.DEFAULT)
            // NOTE: customized loggerHandler to not log health or ping requests
            routerBuilder.rootHandler {
                if (it.request().path() == "/api/health" ||
                    (it.request().path() == "/api/user" && it.request().method() == HttpMethod.GET)
                ) {
                    it.next()
                } else {
                    loggerHandler.handle(it)
                }
            }

            routerBuilder.operation("health").coroutineHandler(this, ::health)
            routerBuilder.operation("getLoginProviders").coroutineHandler(this, authHandler)

            routerBuilder.operation("getCurrentUser")
                .userCoroutineHandler(this, userRoute::getCurrentUser)
            routerBuilder.operation("doLogin").coroutineHandler(this, authHandler)
            routerBuilder.operation("doLoginExt").coroutineHandler(this, authHandler)
            routerBuilder.operation("doLogout").coroutineHandler(this, userRoute::logout)

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

            routerBuilder.operation("getAllEnvs")
                .userCoroutineHandler(this, collectionRoute::getAllEnvs)
            routerBuilder.operation("createEnv")
                .userCoroutineHandler(this, collectionRoute::createEnv)
            routerBuilder.operation("setEnvData")
                .userCoroutineHandler(this, collectionRoute::setEnvData)
            routerBuilder.operation("deleteEnv")
                .userCoroutineHandler(this, collectionRoute::deleteEnv)

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
            routerBuilder.operation("getConfig")
                .adminCoroutineHandler(this, adminRoute::getConfig)
            routerBuilder.operation("setConfig")
                .adminCoroutineHandler(this, adminRoute::updateConfig)

            val router = routerBuilder.createRouter()
            router.route("/*").coroutineHandler(this, StaticHandler.create())
            var authConfig = daoManager.configDao.getByName(ConfigDb.AUTH_CONFIG)?.getConfig()
            if (authConfig == null) {
                val newConfig = ConfigDb.createEmptyAuthConfig()
                authConfig = newConfig.getConfig()
                daoManager.configDao.create(newConfig)
            }
            try {
                authHandler.init(router, authConfig)
            } catch (e: Exception) {
                log.error("Bad auth config: $e")
            }

            router.route().failureHandler(::handleFailure)

            server = vertx.createHttpServer()
                .requestHandler(router)
                .listen(port)
                .await()
            log.info("Started server on port ${server!!.actualPort()}")
        } catch (t: Throwable) {
            log.error("Could not start server", t)
        }
    }

    public override suspend fun stop() {
        server?.close()?.await()
    }
}

