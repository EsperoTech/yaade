package com.espero.yaade.server

import com.espero.yaade.ADMIN_USERNAME
import com.espero.yaade.BASE_PATH
import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.ConfigDb
import com.espero.yaade.server.auth.AuthHandler
import com.espero.yaade.server.errors.handleFailure
import com.espero.yaade.server.routes.*
import com.espero.yaade.server.utils.adminCoroutineHandler
import com.espero.yaade.server.utils.coroutineHandler
import com.espero.yaade.server.utils.userCoroutineHandler
import com.espero.yaade.services.RequestSender
import io.vertx.core.http.HttpMethod
import io.vertx.core.http.HttpServer
import io.vertx.core.impl.logging.LoggerFactory
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.*
import io.vertx.ext.web.openapi.RouterBuilder
import io.vertx.ext.web.sstore.LocalSessionStore
import io.vertx.ext.web.sstore.SessionStore
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait

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
                server!!.close().coAwait()
                sessionStore!!.clear().coAwait()
                sessionStore!!.close()
            }
            sessionStore = LocalSessionStore.create(vertx)
            val authHandler = AuthHandler(vertx, daoManager)
            val requestSender = RequestSender(vertx, daoManager)

            val collectionRoute = CollectionRoute(daoManager, vertx)
            val requestRoute = RequestRoute(daoManager)
            val userRoute = UserRoute(daoManager, vertx)
            val adminRoute = AdminRoute(daoManager, vertx, authHandler::testAuthConfig, this)
            val invokeRoute = InvokeRoute(daoManager, requestSender)
            val certificateRoute = CertificateRoute(daoManager, vertx)
            val fileRoute = FileRoute(daoManager)
            val scriptRoute = ScriptRoute(daoManager, vertx)

            val routerBuilder = RouterBuilder.create(vertx, "openapi.yaml").coAwait()

            routerBuilder.rootHandler(
                SessionHandler.create(sessionStore).setSessionTimeout(sessionTimeout)
            )
            routerBuilder.rootHandler(
                BodyHandler
                    .create()
                    .setUploadsDirectory("/tmp")
            )
            val loggerHandler = LoggerHandler.create(LoggerFormat.DEFAULT)
            // NOTE: customized loggerHandler to not log health or ping requests
            routerBuilder.rootHandler {
                if (it.request().path().contains("/api/health") ||
                    (it.request().path().contains("/api/user") && it.request()
                        .method() == HttpMethod.GET)
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
            routerBuilder.operation("duplicateCollection")
                .userCoroutineHandler(this, collectionRoute::duplicateCollection)
            routerBuilder.operation("putCollection")
                .userCoroutineHandler(this, collectionRoute::putCollection)
            routerBuilder.operation("moveCollection")
                .userCoroutineHandler(this, collectionRoute::moveCollection)
            routerBuilder.operation("deleteCollection")
                .userCoroutineHandler(this, collectionRoute::deleteCollection)
            routerBuilder.operation("importOpenApi")
                .userCoroutineHandler(this, collectionRoute::importOpenApiCollection)
            routerBuilder.operation("importPostman")
                .userCoroutineHandler(this, collectionRoute::importPostmanCollection)

            routerBuilder.operation("createEnv")
                .userCoroutineHandler(this, collectionRoute::createEnv)
            routerBuilder.operation("updateEnv")
                .userCoroutineHandler(this, collectionRoute::updateEnv)
            routerBuilder.operation("deleteEnv")
                .userCoroutineHandler(this, collectionRoute::deleteEnv)

            routerBuilder.operation("setSecret")
                .userCoroutineHandler(this, collectionRoute::setSecret)
            routerBuilder.operation("deleteSecret")
                .userCoroutineHandler(this, collectionRoute::deleteSecret)

            routerBuilder.operation("postRequest")
                .userCoroutineHandler(this, requestRoute::postRequest)
            routerBuilder.operation("putRequest")
                .userCoroutineHandler(this, requestRoute::putRequest)
            routerBuilder.operation("moveRequest")
                .userCoroutineHandler(this, requestRoute::moveRequest)
            routerBuilder.operation("deleteRequest")
                .userCoroutineHandler(this, requestRoute::deleteRequest)

            routerBuilder.operation("invoke")
                .userCoroutineHandler(this, invokeRoute::invoke)

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
            routerBuilder.operation("getCertificates")
                .userCoroutineHandler(this, certificateRoute::getCertificates)
            routerBuilder.operation("createCertificate")
                .userCoroutineHandler(this, certificateRoute::createCertificate)
            routerBuilder.operation("deleteCertificate")
                .userCoroutineHandler(this, certificateRoute::deleteCertificate)
            routerBuilder.operation("exchangeToken")
                .userCoroutineHandler(this, userRoute::exchangeOAuth2Code)
            routerBuilder.operation("getFiles")
                .userCoroutineHandler(this, fileRoute::getFiles)
            routerBuilder.operation("uploadFile")
                .userCoroutineHandler(this, fileRoute::uploadFile)
            routerBuilder.operation("downloadFile")
                .userCoroutineHandler(this, fileRoute::downloadFile)
            routerBuilder.operation("deleteFile")
                .userCoroutineHandler(this, fileRoute::deleteFile)
            routerBuilder.operation("createScript")
                .adminCoroutineHandler(this, scriptRoute::createScript)
            routerBuilder.operation("deleteScript")
                .adminCoroutineHandler(this, scriptRoute::deleteScript)
            routerBuilder.operation("updateScript")
                .adminCoroutineHandler(this, scriptRoute::updateScript)
            routerBuilder.operation("getScript")
                .adminCoroutineHandler(this, scriptRoute::getScript)
            routerBuilder.operation("runScript")
                .adminCoroutineHandler(this, scriptRoute::runScript)

            val router = routerBuilder.createRouter()
            router.route("/*").coroutineHandler(this, StaticHandler.create())

            val admin = daoManager.userDao.getByUsername(ADMIN_USERNAME)

            if (admin == null) {
                val adminUser = daoManager.userDao.createUser(ADMIN_USERNAME, listOf("admin"))
                log.info("Created admin user")
                val data = JsonObject().put("name", "Collection").put("groups", listOf("admin"))
                val collection = CollectionDb(data, adminUser.id)
                daoManager.collectionDao.create(collection)
            } else {
                if (!admin.groups().contains("admin")) {
                    admin.setGroups(setOf("admin"))
                    daoManager.userDao.update(admin)
                    log.info("Added admin user to admin group")
                }
            }

            var authConfig = daoManager.configDao.getByName(ConfigDb.AUTH_CONFIG)?.getConfig()
            if (authConfig == null) {
                val newConfig = ConfigDb.createEmptyAuthConfig()
                authConfig = newConfig.getConfig()
                daoManager.configDao.create(newConfig)
            }

            router.route().failureHandler(::handleFailure)

            val mainRouter = Router.router(vertx)
            mainRouter.route("$BASE_PATH/*").subRouter(router)

            try {
                authHandler.init(mainRouter, authConfig)
            } catch (e: Exception) {
                log.error("Bad auth config: $e")
            }

            server = vertx.createHttpServer()
                .requestHandler(mainRouter)
                .listen(port)
                .coAwait()
            log.info("Started server on port ${server!!.actualPort()}")
        } catch (t: Throwable) {
            log.error("Could not start server", t)
        }
    }

    public override suspend fun stop() {
        server?.close()?.coAwait()
    }
}

