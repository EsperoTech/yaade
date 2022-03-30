package com.espero.yaade.services

import com.espero.yaade.model.db.RequestDb
import io.swagger.v3.oas.models.OpenAPI

object OpenApiService {
    fun createRequestsFromOpenApi(openApi: OpenAPI, basePath: String, collectionId: Long): List<RequestDb> {
        val requests = mutableListOf<RequestDb>()
        for ((path, pathItem) in openApi.paths) {
            if (pathItem.get != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.get, basePath, collectionId, "GET"))
            }
            if (pathItem.post != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.post, basePath, collectionId, "POST"))
            }
            if (pathItem.put != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.put, basePath, collectionId, "PUT"))
            }
            if (pathItem.delete != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.delete, basePath, collectionId, "DELETE"))
            }
            if (pathItem.patch != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.patch, basePath, collectionId, "PATCH"))
            }
            if (pathItem.head != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.head, basePath, collectionId, "HEAD"))
            }
            if (pathItem.trace != null) {
                requests.add(RequestDb.fromOpenApiOperation(path, pathItem.trace, basePath, collectionId, "TRACE"))
            }
        }
        return requests
    }
}
