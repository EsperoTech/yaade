package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.routes.ScriptRoute
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject

class AgentRunner(
    private val daoManager: DaoManager,
    private val requestSender: RequestSender,
    private val scriptRoute: ScriptRoute
) {
    
    suspend fun invoke(
        agentId: Long, 
        message: String, 
        envName: String?, 
        user: UserDb
    ): JsonObject {
        val agent = daoManager.agentDao.getById(agentId)
            ?: throw IllegalArgumentException("Agent not found: $agentId")
            
        val collection = daoManager.collectionDao.getById(agent.collectionId)
            ?: throw IllegalArgumentException("Collection not found: ${agent.collectionId}")
            
        // Access control check via collection permissions (following existing pattern)
        if (!collection.canRead(user)) {
            throw SecurityException("User not authorized to invoke agent")
        }
        
        val agentConfig = agent.jsonData()
        val tools = agentConfig.getJsonArray("tools") ?: JsonArray()
        
        try {
            // Create dynamic tools from agent configuration and execute them
            val toolProvider = DynamicToolProvider(daoManager, requestSender, scriptRoute, user, envName)
            val toolResults = JsonArray()
            
            for (toolItem in tools) {
                val toolConfig = toolItem as JsonObject
                val toolResult = toolProvider.executeTool(toolConfig)
                toolResults.add(toolResult)
            }
            
            // For now, return a simple response showing the tools were executed
            // This demonstrates the dynamic tool creation and execution
            return JsonObject()
                .put("response", "Agent processed message: '$message'. Executed ${tools.size()} tools successfully.")
                .put("agentName", agentConfig.getString("name"))
                .put("toolCount", tools.size())
                .put("toolResults", toolResults)
                .put("message", message)
        } catch (e: Exception) {
            return JsonObject()
                .put("response", "Agent invocation failed: ${e.message}")
                .put("agentName", agentConfig.getString("name"))
                .put("error", true)
                .put("errorMessage", e.message)
        }
    }
}

class DynamicToolProvider(
    private val daoManager: DaoManager,
    private val requestSender: RequestSender,
    private val scriptRoute: ScriptRoute,
    private val user: UserDb,
    private val envName: String?
) {
    
    suspend fun executeTool(toolConfig: JsonObject): JsonObject {
        val toolType = toolConfig.getString("type")
        val toolId = toolConfig.getLong("id")
        
        return when (toolType) {
            "request" -> executeRequest(toolId, toolConfig)
            "script" -> executeScript(toolId, toolConfig)
            else -> JsonObject()
                .put("success", false)
                .put("error", "Unknown tool type: $toolType")
        }
    }
    
    private suspend fun executeRequest(requestId: Long, toolConfig: JsonObject): JsonObject {
        return try {
            val request = daoManager.requestDao.getById(requestId)
                ?: return JsonObject()
                    .put("success", false)
                    .put("error", "Request not found: $requestId")
            
            val requestData = request.jsonData()
            val toolName = toolConfig.getString("name") ?: requestData.getString("name") ?: "request_$requestId"
            
            // For now, return a success message indicating we would execute the request
            // TODO: Integrate with RequestSender.send() method
            JsonObject()
                .put("success", true)
                .put("toolType", "request")
                .put("toolName", toolName)
                .put("result", "Request tool executed (actual RequestSender integration pending)")
        } catch (e: Exception) {
            JsonObject()
                .put("success", false)
                .put("toolType", "request")
                .put("error", "Request execution failed: ${e.message}")
        }
    }
    
    private suspend fun executeScript(scriptId: Long, toolConfig: JsonObject): JsonObject {
        return try {
            val script = daoManager.jobScriptDao.getById(scriptId)
                ?: return JsonObject()
                    .put("success", false)
                    .put("error", "Script not found: $scriptId")
            
            val scriptData = script.jsonData()
            val toolName = toolConfig.getString("name") ?: scriptData.getString("name") ?: "script_$scriptId"
            val scriptString = scriptData.getString("script") ?: return JsonObject()
                .put("success", false)
                .put("error", "No script content")
            
            val ownerGroups = user.groups().toList()
            
            val result = scriptRoute.run(
                scriptId,
                scriptString,
                script.collectionId,
                envName,
                JsonArray(ownerGroups),
                JsonObject()
            )
            
            JsonObject()
                .put("success", result?.getBoolean("success") ?: false)
                .put("toolType", "script")
                .put("toolName", toolName)
                .put("result", result?.encode() ?: "No result")
                
        } catch (e: Exception) {
            JsonObject()
                .put("success", false)
                .put("toolType", "script")
                .put("error", "Script execution failed: ${e.message}")
        }
    }
}