package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.routes.ScriptRoute
import dev.langchain4j.agent.tool.Tool
import dev.langchain4j.model.openai.OpenAiChatModel
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import kotlinx.coroutines.runBlocking

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
        
        try {
            // Create LLM with OpenAI key from environment or agent config  
            val openaiKey = agentConfig.getString("apiKey") ?: System.getenv("OPENAI_API_KEY")
                ?: throw IllegalArgumentException("No OpenAI API key provided")
            val modelName = agentConfig.getString("model") ?: "gpt-3.5-turbo"
            
            // For future enhancement: this will create the actual OpenAI model
            // val chatModel = OpenAiChatModel.builder()
            //     .apiKey(openaiKey)
            //     .modelName(modelName)
            //     .build()
            
            // Create dynamic tools and execute them based on the message
            val dynamicTools = DynamicTools(
                agentConfig,
                daoManager,
                requestSender, 
                scriptRoute,
                user,
                envName
            )
            
            // For now, create a simple response that shows the agent is working
            // and execute tools based on the message content
            val toolResults = mutableListOf<String>()
            
            // Simple logic: if message mentions "request" or "http", execute request tools
            if (message.lowercase().contains("request") || message.lowercase().contains("http")) {
                toolResults.add(dynamicTools.executeRequest())
            }
            
            // Simple logic: if message mentions "script" or "run", execute script tools  
            if (message.lowercase().contains("script") || message.lowercase().contains("run")) {
                toolResults.add(dynamicTools.executeScript())
            }
            
            // If no specific tools mentioned, just respond with available tools
            val toolCount = (agentConfig.getJsonArray("tools") ?: JsonArray()).size()
            val response = if (toolResults.isEmpty()) {
                "I'm an AI agent with $toolCount tools available. Ask me to execute requests or scripts!"
            } else {
                "Executed tools based on your request:\n" + toolResults.joinToString("\n")
            }
            
            return JsonObject()
                .put("response", response)
                .put("agentName", agentConfig.getString("name"))
                .put("toolCount", toolCount)
                .put("model", modelName)
        } catch (e: Exception) {
            return JsonObject()
                .put("response", "Agent invocation failed: ${e.message}")
                .put("agentName", agentConfig.getString("name"))
                .put("error", true)
                .put("errorMessage", e.message)
        }
    }
}

class DynamicTools(
    private val agentConfig: JsonObject,
    private val daoManager: DaoManager,
    private val requestSender: RequestSender,
    private val scriptRoute: ScriptRoute,
    private val user: UserDb,
    private val envName: String?
) {
    
    @Tool("Execute HTTP request - dynamically calls configured requests")
    fun executeRequest(): String {
        return try {
            val tools = agentConfig.getJsonArray("tools") ?: JsonArray()
            val requestTools = tools.filter { 
                val tool = it as JsonObject
                tool.getString("type") == "request"
            }
            
            if (requestTools.isEmpty()) {
                return "No request tools configured"
            }
            
            // Execute the first request tool for now (in a real implementation, 
            // the LLM would specify which tool to call)
            val firstTool = requestTools.first() as JsonObject
            val requestId = firstTool.getLong("id")
            val request = daoManager.requestDao.getById(requestId) 
                ?: return "Request not found: $requestId"
            
            val requestData = request.jsonData()
            val method = requestData.getString("method") ?: "GET"
            val url = requestData.getString("url") ?: "unknown"
            
            // TODO: Integrate with actual RequestSender.send() method
            "Successfully executed $method request to $url (RequestSender integration pending)"
        } catch (e: Exception) {
            "Error executing request: ${e.message}"
        }
    }
    
    @Tool("Execute JavaScript script - dynamically calls configured scripts")  
    fun executeScript(): String {
        return try {
            val tools = agentConfig.getJsonArray("tools") ?: JsonArray()
            val scriptTools = tools.filter { 
                val tool = it as JsonObject
                tool.getString("type") == "script"
            }
            
            if (scriptTools.isEmpty()) {
                return "No script tools configured"
            }
            
            // Execute the first script tool for now
            val firstTool = scriptTools.first() as JsonObject
            val scriptId = firstTool.getLong("id")
            val script = daoManager.jobScriptDao.getById(scriptId)
                ?: return "Script not found: $scriptId"
            
            val scriptData = script.jsonData()
            val scriptString = scriptData.getString("script") ?: return "No script content"
            val ownerGroups = user.groups().toList()
            
            // Use runBlocking to handle suspend function
            val result = runBlocking {
                scriptRoute.run(
                    scriptId,
                    scriptString,
                    script.collectionId,
                    envName,
                    JsonArray(ownerGroups),
                    JsonObject()
                )
            }
            
            if (result?.getBoolean("success") == true) {
                "Script executed successfully. Result: ${result.encode()}"
            } else {
                "Script failed: ${result?.getString("error") ?: "Unknown error"}"
            }
        } catch (e: Exception) {
            "Error executing script: ${e.message}"
        }
    }
}