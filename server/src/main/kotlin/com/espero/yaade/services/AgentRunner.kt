package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.routes.ScriptRoute
import dev.langchain4j.agent.tool.Tool
import dev.langchain4j.memory.chat.MessageWindowChatMemory
import dev.langchain4j.model.openai.OpenAiChatModel
import dev.langchain4j.service.AiServices
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
            
            val chatModel = OpenAiChatModel.builder()
                .apiKey(openaiKey)
                .modelName(modelName)
                .build()
            
            // Create dynamic tools instance with access to configured tools
            val dynamicTools = DynamicAgentTools(
                agentConfig,
                daoManager,
                requestSender,
                scriptRoute,
                user,
                envName
            )
            
            // Create AI service with tools
            val memory = MessageWindowChatMemory.withMaxMessages(10)
            val assistant = AiServices.builder(AgentAssistant::class.java)
                .chatModel(chatModel)
                .tools(dynamicTools)
                .chatMemory(memory)
                .build()
            
            // Invoke the agent with the user's message
            val response = assistant.chat(message)
            
            return JsonObject()
                .put("response", response)
                .put("agentName", agentConfig.getString("name"))
                .put("toolCount", (agentConfig.getJsonArray("tools") ?: JsonArray()).size())
                .put("model", modelName)
        } catch (e: Exception) {
            return JsonObject()
                .put("response", "Agent invocation failed: ${e.message}")
                .put("agentName", agentConfig.getString("name"))
                .put("error", true)
                .put("errorMessage", e.message)
        }
    }
    
    interface AgentAssistant {
        fun chat(message: String): String
    }
}

// Dynamic tools class that provides @Tool annotated methods to langchain4j
class DynamicAgentTools(
    private val agentConfig: JsonObject,
    private val daoManager: DaoManager,
    private val requestSender: RequestSender,
    private val scriptRoute: ScriptRoute,
    private val user: UserDb,
    private val envName: String?
) {
    
    @Tool("Execute HTTP requests configured for this agent")
    fun executeHttpRequest(): String {
        return runBlocking {
            executeConfiguredTool("request")
        }
    }
    
    @Tool("Execute JavaScript scripts configured for this agent")
    fun executeJavaScriptScript(): String {
        return runBlocking {
            executeConfiguredTool("script")
        }
    }
    
    private suspend fun executeConfiguredTool(toolType: String): String {
        try {
            val tools = agentConfig.getJsonArray("tools") ?: JsonArray()
            val matchingTools = tools.filter { 
                val tool = it as JsonObject
                tool.getString("type") == toolType
            }
            
            if (matchingTools.isEmpty()) {
                return "No $toolType tools configured for this agent"
            }
            
            // Execute the first matching tool (in a real implementation, 
            // the LLM could specify parameters to choose which tool)
            val firstTool = matchingTools.first() as JsonObject
            val toolId = firstTool.getLong("id")
            
            when (toolType) {
                "request" -> {
                    val request = daoManager.requestDao.getById(toolId)
                        ?: return "Request not found: $toolId"
                    
                    val requestData = request.jsonData()
                    val method = requestData.getString("method") ?: "GET"
                    val url = requestData.getString("url") ?: "unknown"
                    
                    // TODO: Integrate with actual RequestSender.send() method
                    return "Successfully executed $method request to $url (RequestSender integration pending)"
                }
                "script" -> {
                    val script = daoManager.jobScriptDao.getById(toolId)
                        ?: return "Script not found: $toolId"
                    
                    val scriptData = script.jsonData()
                    val scriptString = scriptData.getString("script") ?: return "No script content"
                    val ownerGroups = user.groups().toList()
                    
                    val result = scriptRoute.run(
                        toolId,
                        scriptString,
                        script.collectionId,
                        envName,
                        JsonArray(ownerGroups),
                        JsonObject()
                    )
                    
                    return if (result?.getBoolean("success") == true) {
                        "Script executed successfully. Result: ${result.encode()}"
                    } else {
                        "Script failed: ${result?.getString("error") ?: "Unknown error"}"
                    }
                }
                else -> return "Unknown tool type: $toolType"
            }
        } catch (e: Exception) {
            return "Error executing $toolType tool: ${e.message}"
        }
    }
}