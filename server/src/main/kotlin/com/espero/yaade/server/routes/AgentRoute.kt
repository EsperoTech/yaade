package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.AgentDb
import com.espero.yaade.services.AgentRunner
import com.espero.yaade.server.errors.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.ext.web.RoutingContext
import io.vertx.core.json.JsonObject
import io.vertx.kotlin.coroutines.coAwait

class AgentRoute(
    private val daoManager: DaoManager,
    private val agentRunner: AgentRunner
) {
    
    suspend fun create(ctx: RoutingContext) {
        val agentData = ctx.body().asJsonObject()
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No agent data provided")
            
        val collectionId = agentData.getLong("collectionId")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No collectionId provided")
            
        val collection = daoManager.collectionDao.getById(collectionId)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Collection not found")
            
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        if (!collection.canRead(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "Not authorized for this collection")
        }
        
        val agent = AgentDb(collectionId, agentData)
        daoManager.agentDao.create(agent)
        
        ctx.response().setStatusCode(201).end(JsonObject().put("id", agent.id).encode()).coAwait()
    }
    
    suspend fun getById(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val agent = daoManager.agentDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Agent not found")
            
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        val collection = daoManager.collectionDao.getById(agent.collectionId)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Collection not found")
            
        if (!collection.canRead(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "Not authorized to read this agent")
        }
        
        val response = agent.jsonData().put("id", agent.id)
        ctx.end(response.encode()).coAwait()
    }
    
    suspend fun update(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val agent = daoManager.agentDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Agent not found")
            
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        val collection = daoManager.collectionDao.getById(agent.collectionId)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Collection not found")
            
        if (!collection.canRead(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "Not authorized to update this agent")
        }
        
        val updatedData = ctx.body().asJsonObject()
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No agent data provided")
            
        agent.setData(updatedData)
        daoManager.agentDao.update(agent)
        
        ctx.response().setStatusCode(200).end().coAwait()
    }
    
    suspend fun delete(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val agent = daoManager.agentDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Agent not found")
            
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        val collection = daoManager.collectionDao.getById(agent.collectionId)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Collection not found")
            
        if (!collection.canRead(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "Not authorized to delete this agent")
        }
        
        daoManager.agentDao.delete(agent)
        ctx.response().setStatusCode(204).end().coAwait()
    }
    
    suspend fun invoke(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val body = ctx.body().asJsonObject()
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No request body provided")
            
        val message = body.getString("message")
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No message provided")
            
        val envName = body.getString("envName")
        
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        val result = agentRunner.invoke(id, message, envName, user)
        ctx.end(result.encode()).coAwait()
    }
}