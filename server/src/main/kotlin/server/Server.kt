package server

import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.BodyHandler
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.await
import server.routes.health

class Server(private val port: Int) : CoroutineVerticle() {

    override suspend fun start() {
        val router = Router.router(vertx)
        router.route().handler(BodyHandler.create())
        router.get("/api/health").coroutineHandler(this, ::health)

        val server = vertx.createHttpServer()
            .requestHandler(router)
            .listen(port)
            .await()

        println("Started server on port ${server.actualPort()}")
    }
}