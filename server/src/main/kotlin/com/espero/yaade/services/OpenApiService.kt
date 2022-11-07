package com.espero.yaade.services

import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.RequestDb
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.Operation
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

object OpenApiService {

    private fun extractRequestFromOperation(path: String, basePath: String, collection: CollectionDb, method: String, operation: Operation): RequestDb {
        val headers = JsonArray()
        var queryParams = ""
        var replacedPath = path
        operation.parameters?.forEach { param ->
            collection.setEnvVar("default", param.name, "")
            when (param.`in`) {
                "header" -> headers.add(JsonObject().put("key", param.name).put("value", "$" + "{${param.name}}"))
                "query" -> {
                    queryParams = if (queryParams == "") "?" else "$queryParams&"
                    queryParams += "${param.name}="+"$" + "{${param.name}}"
                }
                "path" -> {
                    replacedPath = replacedPath.replace("{${param.name}}", "$" + "{${param.name}}")
                }
            }
        }
        val name = operation.operationId ?: path
        return RequestDb.fromOpenApiOperation(replacedPath, name, basePath, collection.id, method, queryParams, headers)
    }

    fun createRequestsFromOpenApi(openApi: OpenAPI, basePath: String, collection: CollectionDb): List<RequestDb> {
        openApi.components.schemas
        val requests = mutableListOf<RequestDb>()
        for ((path, pathItem) in openApi.paths) {
            if (pathItem.get != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "GET", pathItem.get))
            }
            if (pathItem.post != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "POST", pathItem.post))
            }
            if (pathItem.put != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "PUT", pathItem.put))
            }
            if (pathItem.delete != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "DELETE", pathItem.delete))
            }
            if (pathItem.patch != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "PATCH", pathItem.patch))
            }
            if (pathItem.head != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "HEAD", pathItem.post))
            }
            if (pathItem.trace != null) {
                requests.add(extractRequestFromOperation(path, basePath, collection, "TRACE", pathItem.trace))
            }
        }
        return requests
    }

}
