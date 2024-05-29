package com.espero.yaade.services

import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.server.Server
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.Operation
import io.vertx.core.impl.logging.LoggerFactory
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import org.openapitools.codegen.examples.ExampleGenerator

object OpenApiService {

    private val log = LoggerFactory.getLogger(Server::class.java)

    private fun extractRequestFromOperation(
        path: String,
        basePath: String,
        collection: CollectionDb,
        method: String,
        operation: Operation,
        exampleGenerator: ExampleGenerator
    ): RequestDb {
        val headers = JsonArray()
        var queryParams = ""
        var replacedPath = path
        operation.parameters?.forEach { param ->
            collection.setEnvVar("default", param.name, "")
            when (param.`in`) {
                "header" -> headers.add(
                    JsonObject().put("key", param.name).put("value", "$" + "{${param.name}}")
                )

                "query" -> {
                    queryParams = if (queryParams == "") "?" else "$queryParams&"
                    queryParams += "${param.name}=" + "$" + "{${param.name}}"
                }

                "path" -> {
                    replacedPath = replacedPath.replace("{${param.name}}", "$" + "{${param.name}}")
                }
            }
        }
        val name = operation.operationId ?: path
        val description = operation.description ?: ""
        var body: String? = null
        if (method != "GET") {
            val mediaTypes = operation.requestBody?.content?.keys?.toList() ?: mutableListOf()
            if (mediaTypes.isNotEmpty()) {
                // NOTE: we only support one request body, so we can only take the first media type
                val mediaType = mediaTypes[0]
                val schema = operation.requestBody.content[mediaType]?.schema

                try {
                    val examples = exampleGenerator.generate(null, mediaTypes, schema)
                    if (examples.isNotEmpty()) {
                        body = examples[0]["example"]
                    }
                } catch (e: Exception) {
                    // NOTE: we don't want to crash the whole thing if we can't generate an example
                    log.error("Error generating example for request body", e)
                }

            }
        }

        return RequestDb(
            collection.id, JsonObject()
                .put("name", name)
                .put("description", description)
                .put("uri", basePath + path + queryParams)
                .put("method", method)
                .put("headers", headers)
                .put("body", body)
        )
    }

    fun createRequestsFromOpenApi(
        openApi: OpenAPI,
        basePath: String,
        collection: CollectionDb
    ): List<RequestDb> {
        val requests = mutableListOf<RequestDb>()
        val exampleGenerator = ExampleGenerator(
            openApi.components.schemas,
            openApi
        )
        for ((path, pathItem) in openApi.paths) {
            if (pathItem.get != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "GET",
                        pathItem.get,
                        exampleGenerator
                    )
                )
            }
            if (pathItem.post != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "POST",
                        pathItem.post,
                        exampleGenerator
                    )
                )
            }
            if (pathItem.put != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "PUT",
                        pathItem.put,
                        exampleGenerator
                    )
                )
            }
            if (pathItem.delete != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "DELETE",
                        pathItem.delete,
                        exampleGenerator
                    )
                )
            }
            if (pathItem.patch != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "PATCH",
                        pathItem.patch,
                        exampleGenerator
                    )
                )
            }
            if (pathItem.head != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "HEAD",
                        pathItem.post,
                        exampleGenerator
                    )
                )
            }
            if (pathItem.trace != null) {
                requests.add(
                    extractRequestFromOperation(
                        path,
                        basePath,
                        collection,
                        "TRACE",
                        pathItem.trace,
                        exampleGenerator
                    )
                )
            }
        }
        return requests
    }

}
