import io.vertx.core.Vertx
import server.Server

const val port = 9339

fun main() {
    val vertx = Vertx.vertx()
    vertx.deployVerticle(Server(port))
}