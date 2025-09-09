# User-defined AI Agents Implementation Plan

## Overview

Implement user-defined AI agents in Yaade's backend that can be configured, stored alongside requests/scripts, and invoked with dynamic tool access to existing requests/scripts via langchain4j. Each agent will see individual tools with specific names and descriptions (e.g., "get_user_info", "send_email") rather than generic execution functions.

## Current State Analysis

From research analysis:
- Yaade uses Kotlin + Vert.x with ORMLite for database access
- Established patterns exist for entities: `RequestDb`, `CollectionDb`, `JobScriptDb`
- Execution infrastructure exists: `RequestSender.send()`, `ScriptRunner.run()`  
- No existing langchain4j integration (clean slate)
- JSON-centric data storage with `ByteArray` fields for flexibility
- Layered architecture: DAO → Service → Route

### Key Discoveries:
- `InvokeRoute.kt:12-38` - Request execution via `requestSender.send(data, collection, envName, user)`
- `ScriptRoute.kt:146-187` - Script execution via `scriptRunner.run(id, script, collectionId, envName, groups, envData)`
- `CollectionRoute.kt` - Pattern for including nested data in collection responses
- Environment variable system for context injection

## Desired End State

After implementation:
- Users can create/edit/delete AI agents via API endpoints
- Agents stored in database with JSON configuration
- Agent invocation dynamically creates langchain4j tools from configured requests/scripts
- Each tool has specific name/description from the underlying request/script
- Collection responses include agents alongside requests/scripts
- Full CRUD operations following existing patterns

**Verification**: Agent can be created, configured with specific request/script tools, invoked, and execute those tools with correct parameters.

## What We're NOT Doing

- Frontend/UI implementation (backend only)
- Agent conversation persistence (stateless invocations)
- Custom tool types beyond requests/scripts
- Agent-to-agent communication
- Model selection UI (configuration only)
- Advanced agent orchestration or workflows

## Implementation Approach

Follow established Yaade patterns: Database entity → DAO → Service → Route layers. Leverage existing request/script execution infrastructure by calling the same service methods that HTTP endpoints use. Create dynamic langchain4j tools at runtime based on agent configuration.

## Phase 1: Database & DAO Foundation

### Overview
Create the database foundation for storing AI agents using the same patterns as existing entities.

### Changes Required:

#### 1. Agent Database Entity
**File**: `server/src/main/kotlin/com/espero/yaade/model/db/AgentDb.kt`
**Changes**: Create new entity following `RequestDb` pattern

```kotlin
package com.espero.yaade.model.db

import com.j256.ormlite.field.DataType
import com.j256.ormlite.field.DatabaseField
import com.j256.ormlite.table.DatabaseTable
import io.vertx.core.json.JsonObject

@DatabaseTable(tableName = "agents")
class AgentDb {
    
    private constructor()
    
    @DatabaseField(generatedId = true)
    var id: Long = -1
    
    @DatabaseField(index = true) 
    var collectionId: Long = -1
    
    @DatabaseField
    lateinit var version: String
    
    @DatabaseField(dataType = DataType.BYTE_ARRAY)
    lateinit var data: ByteArray
    
    constructor(collectionId: Long, data: JsonObject) {
        this.collectionId = collectionId
        this.version = "1.0.0"
        this.data = data.encode().toByteArray()
    }
    
    constructor(id: Long, collectionId: Long, version: String, data: JsonObject) {
        this.id = id
        this.collectionId = collectionId
        this.version = version
        this.data = data.encode().toByteArray()
    }
    
    fun setData(data: JsonObject) {
        this.data = data.encode().toByteArray()
    }
    
    fun jsonData(): JsonObject {
        return JsonObject(data.decodeToString())
    }
}
```

**Agent JSON Data Structure**:
```json
{
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries and support requests",
  "systemPrompt": "You are a helpful customer support agent. Use the available tools to help customers with their requests.",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000,
  "tools": [
    {
      "type": "request",
      "config": {
        "id": 123
      }
    },
    {
      "type": "script", 
      "config": {
        "id": 456
      }
    }
  ]
}
```

**Note**: Tools have consistent structure with `type` and `config` fields. Tool names and descriptions are fetched from the actual RequestDb/JobScriptDb entities at runtime.

#### 2. Agent DAO
**File**: `server/src/main/kotlin/com/espero/yaade/db/AgentDao.kt`
**Changes**: Create DAO following `RequestDao` pattern

```kotlin
package com.espero.yaade.db

import com.espero.yaade.model.db.AgentDb
import com.j256.ormlite.support.ConnectionSource

class AgentDao(connectionSource: ConnectionSource) : BaseDao<AgentDb>(connectionSource, AgentDb::class.java) {
    
    fun getByCollectionId(collectionId: Long): List<AgentDb> {
        return queryBuilder().where().eq("collectionId", collectionId).query()
    }
    
    fun deleteAllInCollection(collectionId: Long): Int {
        return deleteBuilder().where().eq("collectionId", collectionId).delete()
    }
}
```

#### 3. DAO Manager Integration
**File**: `server/src/main/kotlin/com/espero/yaade/db/DaoManager.kt`
**Changes**: Add agent DAO to manager

```kotlin
// Add property
val agentDao: AgentDao by lazy { AgentDao(connectionSource) }

// Add to createTables() method
TableUtils.createTableIfNotExists(connectionSource, AgentDb::class.java)
```

### Success Criteria:

#### Automated Verification:
- [ ] Database migration runs successfully: `./gradlew run` (creates agents table)
- [ ] Unit tests pass: `./gradlew test -Dtest.single=AgentDaoTest`
- [x] Build compiles: `./gradlew compileKotlin`
- [ ] No linting errors: `./gradlew ktlintCheck`

#### Manual Verification:
- [ ] Agent table exists in database with correct schema
- [ ] DAO operations work (create/read/update/delete)  
- [ ] Foreign key relationship to collections works
- [ ] AgentDao methods work correctly (getByCollectionId, deleteAllInCollection)

---

## Phase 2: langchain4j Service Layer with Dynamic Tools

### Overview
Implement the core agent execution service that dynamically creates langchain4j tools from configured requests/scripts.

### Changes Required:

#### 1. Add langchain4j Dependency
**File**: `server/build.gradle.kts`
**Changes**: Add langchain4j dependencies

```kotlin
dependencies {
    // Add langchain4j core dependencies
    implementation("dev.langchain4j:langchain4j:1.4")
    implementation("dev.langchain4j:langchain4j-open-ai:1.4")
    
    // Existing dependencies...
}
```

#### 2. Agent Runner Service with Dynamic Tool Provider
**File**: `server/src/main/kotlin/com/espero/yaade/services/AgentRunner.kt`
**Changes**: Create service using langchain4j 1.4 ToolProvider pattern

```kotlin
package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.JobScriptDb
import com.espero.yaade.model.db.RequestDb
import com.espero.yaade.model.db.UserDb
import dev.langchain4j.model.openai.OpenAiChatModel
import dev.langchain4j.service.AiServices
import dev.langchain4j.service.tool.*
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import kotlinx.coroutines.runBlocking

class AgentRunner(
    private val daoManager: DaoManager,
    private val requestSender: RequestSender,
    private val scriptRunner: ScriptRunner
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
            
        if (!agent.canRead(user)) {
            throw SecurityException("User not authorized to invoke agent")
        }
        
        val agentConfig = agent.jsonData()
        val toolProvider = createDynamicToolProvider(agentConfig, envName, user, collection)
        
        val chatModel = OpenAiChatModel.builder()
            .apiKey(getOpenAiApiKey()) // TODO: Get from config
            .modelName(agentConfig.getString("model", "gpt-4"))
            .temperature(agentConfig.getDouble("temperature", 0.7))
            .maxTokens(agentConfig.getInteger("maxTokens", 1000))
            .build()
            
        val aiService = AiServices.builder(AgentInterface::class.java)
            .chatLanguageModel(chatModel)
            .toolProvider(toolProvider)
            .systemMessageProvider { agentConfig.getString("systemPrompt", "") }
            .build()
            
        val response = aiService.chat(message)
        
        return JsonObject()
            .put("response", response)
            .put("agentName", agentConfig.getString("name"))
    }
    
    private fun createDynamicToolProvider(
        agentConfig: JsonObject, 
        envName: String?, 
        user: UserDb,
        collection: CollectionDb
    ): ToolProvider {
        return YaadeToolProvider(agentConfig, envName, user, collection, daoManager, requestSender, scriptRunner)
    }
    
    private fun getOpenAiApiKey(): String {
        // TODO: Get from configuration
        return System.getenv("OPENAI_API_KEY") ?: throw IllegalStateException("OPENAI_API_KEY not configured")
    }
}

interface AgentInterface {
    fun chat(message: String): String
}
```

#### 3. Dynamic Tool Provider Implementation
**File**: `server/src/main/kotlin/com/espero/yaade/services/YaadeToolProvider.kt`
**Changes**: Implement langchain4j 1.4 ToolProvider for dynamic tool creation

```kotlin
package com.espero.yaade.services

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.CollectionDb
import com.espero.yaade.model.db.UserDb
import dev.langchain4j.agent.tool.ToolSpecification
import dev.langchain4j.data.message.ToolExecutionRequest
import dev.langchain4j.service.tool.ToolExecutor
import dev.langchain4j.service.tool.ToolProvider
import dev.langchain4j.service.tool.ToolProviderRequest
import dev.langchain4j.service.tool.ToolProviderResult
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import kotlinx.coroutines.runBlocking

class YaadeToolProvider(
    private val agentConfig: JsonObject,
    private val envName: String?,
    private val user: UserDb,
    private val collection: CollectionDb,
    private val daoManager: DaoManager,
    private val requestSender: RequestSender,
    private val scriptRunner: ScriptRunner
) : ToolProvider {
    
    private val toolRegistry = mutableMapOf<String, suspend (JsonObject) -> String>()
    
    override fun provideTools(request: ToolProviderRequest): ToolProviderResult {
        val builder = ToolProviderResult.builder()
        val toolConfigs = agentConfig.getJsonArray("tools") ?: JsonArray()
        
        toolConfigs.forEach { toolRef ->
            val toolObj = toolRef as JsonObject
            val toolConfig = toolObj.getJsonObject("config")
            val toolType = toolObj.getString("type")
            
            when (toolType) {
                "request" -> {
                    val requestId = toolConfig.getLong("id")
                    val requestDb = daoManager.requestDao.getById(requestId)
                    if (requestDb != null && requestDb.canRead(user)) {
                        addRequestTool(builder, requestDb, toolConfig)
                    }
                }
                "script" -> {
                    val scriptId = toolConfig.getLong("id")
                    val scriptDb = daoManager.jobScriptDao.getById(scriptId)
                    if (scriptDb != null && scriptDb.canRead(user)) {
                        addScriptTool(builder, scriptDb, toolConfig)
                    }
                }
            }
        }
        
        return builder.build()
    }
    
    private fun addRequestTool(
        builder: ToolProviderResult.Builder,
        request: RequestDb,
        config: JsonObject
    ) {
        val requestData = request.jsonData()
        val toolName = requestData.getString("name") ?: "request_${request.id}"
        val toolDescription = requestData.getString("description") ?: "Execute HTTP request: $toolName"
        
        val spec = ToolSpecification.builder()
            .name(toolName)
            .description(toolDescription)
            .parameters(JsonObjectSchema.builder().build())
            .build()
            
        val executor = ToolExecutor { call, memory ->
            runBlocking {
                try {
                    val result = requestSender.send(requestData, collection, envName, user)
                    "Request executed successfully. Status: ${result.getInteger("status")}, Response: ${result.getString("body")}"
                } catch (e: Exception) {
                    "Request failed: ${e.message}"
                }
            }
        }
        
        builder.add(spec, executor)
    }
    
    private fun addScriptTool(
        builder: ToolProviderResult.Builder,
        script: JobScriptDb,
        config: JsonObject
    ) {
        val scriptData = script.jsonData()
        val toolName = scriptData.getString("name") ?: "script_${script.id}"
        val toolDescription = scriptData.getString("description") ?: "Execute JavaScript: $toolName"
        
        val spec = ToolSpecification.builder()
            .name(toolName)
            .description(toolDescription)
            .parameters(JsonObjectSchema.builder().build())
            .build()
            
        val executor = ToolExecutor { call, memory ->
            runBlocking {
                try {
                    val scriptContent = scriptData.getString("script") ?: ""
                    val ownerGroups = user.groups().toJsonArray()
                    
                    val result = scriptRunner.run(
                        script.id,
                        scriptContent,
                        script.collectionId,
                        envName ?: "",
                        ownerGroups,
                        JsonObject()
                    )
                    
                    if (result?.getBoolean("success", false) == true) {
                        "Script executed successfully: ${result.getString("output", "")}"
                    } else {
                        "Script failed: ${result?.getString("error") ?: "Unknown error"}"
                    }
                } catch (e: Exception) {
                    "Script execution failed: ${e.message}"
                }
            }
        }
        
        builder.add(spec, executor)
    }
    
    private fun Set<String>.toJsonArray(): JsonArray {
        val array = JsonArray()
        this.forEach { array.add(it) }
        return array
    }
}
```


### Success Criteria:

#### Automated Verification:
- [ ] Build compiles with langchain4j: `./gradlew compileKotlin`
- [ ] Unit tests pass: `./gradlew test -Dtest.single=AgentRunnerTest`
- [ ] Tool creation works correctly (unit test)
- [ ] Service integration test passes

#### Manual Verification:
- [ ] Agent can be invoked with configured tools
- [ ] Tools appear with correct names/descriptions in agent context
- [ ] Request tools execute underlying requests correctly
- [ ] Script tools execute underlying scripts correctly
- [ ] Error handling works for failed tool executions

---

## Phase 3: API Endpoints

### Overview
Create HTTP endpoints for agent CRUD operations and invocation following existing route patterns.

### Changes Required:

#### 1. Agent Route
**File**: `server/src/main/kotlin/com/espero/yaade/server/routes/AgentRoute.kt`
**Changes**: Create route following `RequestRoute` pattern

```kotlin
package com.espero.yaade.server.routes

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.AgentDb
import com.espero.yaade.services.AgentRunner
import com.espero.yaade.server.ServerError
import io.netty.handler.codec.http.HttpResponseStatus
import io.vertx.ext.web.RoutingContext
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
        
        val agent = AgentDb(
            collectionId = collectionId,
            data = agentData.encode().toByteArray()
        )
        
        val created = daoManager.agentDao.create(agent)
        ctx.response().setStatusCode(201).end(JsonObject().put("id", created.id).encode()).coAwait()
    }
    
    suspend fun getById(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val agent = daoManager.agentDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Agent not found")
            
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        if (!agent.canRead(user)) {
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
            
        if (!agent.canRead(user)) {
            throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "Not authorized to update this agent")
        }
        
        val updatedData = ctx.body().asJsonObject()
            ?: throw ServerError(HttpResponseStatus.BAD_REQUEST.code(), "No agent data provided")
            
        val updated = agent.copy(data = updatedData.encode().toByteArray())
        daoManager.agentDao.update(updated)
        
        ctx.response().setStatusCode(200).end().coAwait()
    }
    
    suspend fun delete(ctx: RoutingContext) {
        val id = ctx.pathParam("id").toLong()
        val agent = daoManager.agentDao.getById(id)
            ?: throw ServerError(HttpResponseStatus.NOT_FOUND.code(), "Agent not found")
            
        val userId = ctx.user().principal().getLong("id")
        val user = daoManager.userDao.getById(userId)
            ?: throw ServerError(HttpResponseStatus.FORBIDDEN.code(), "User not logged in")
            
        if (!agent.canRead(user)) {
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
```

#### 2. Route Registration
**File**: `server/src/main/kotlin/com/espero/yaade/server/Server.kt`
**Changes**: Add agent routes to server

```kotlin
// Add to route registration section
val agentRunner = AgentRunner(daoManager, requestSender, scriptRunner)
val agentRoute = AgentRoute(daoManager, agentRunner)

// Agent CRUD routes
router.post("/api/agents").coroutineHandler(agentRoute::create)
router.get("/api/agents/:id").coroutineHandler(agentRoute::getById)
router.put("/api/agents/:id").coroutineHandler(agentRoute::update)
router.delete("/api/agents/:id").coroutineHandler(agentRoute::delete)

// Agent invocation route
router.post("/api/agents/:id/invoke").coroutineHandler(agentRoute::invoke)
```

### Success Criteria:

#### Automated Verification:
- [ ] Server starts successfully: `./gradlew run`
- [ ] API endpoints respond correctly: `curl -X POST localhost:8080/api/agents`
- [ ] OpenAPI specification validates (if using)
- [ ] Integration tests pass: `./gradlew test -Dtest.single=AgentRouteTest`

#### Manual Verification:
- [ ] Can create agent via POST /api/agents
- [ ] Can retrieve agent via GET /api/agents/:id  
- [ ] Can update agent via PUT /api/agents/:id
- [ ] Can delete agent via DELETE /api/agents/:id
- [ ] Can invoke agent via POST /api/agents/:id/invoke
- [ ] Proper error handling for invalid requests
- [ ] Access control works correctly

---

## Phase 4: Collection Integration

### Overview
Integrate agents into collection responses so they appear alongside requests and scripts.

### Changes Required:

#### 1. Update Collection Response
**File**: `server/src/main/kotlin/com/espero/yaade/server/routes/CollectionRoute.kt`
**Changes**: Include agents in collection data

```kotlin
// In the getAll() method, add agents to each collection
private fun addNestedData(collection: CollectionDb, user: UserDb): JsonObject {
    val result = collection.jsonData().put("id", collection.id)
    
    // Existing code for requests and scripts...
    val requests = daoManager.requestDao.getByCollectionId(collection.id)
        .filter { it.canRead(user) }
        .map { it.jsonData().put("id", it.id) }
    
    val scripts = daoManager.jobScriptDao.getByCollectionId(collection.id)
        .filter { it.canRead(user) }
        .map { it.jsonData().put("id", it.id) }
    
    // Add agents
    val agents = daoManager.agentDao.getByCollectionId(collection.id)
        .filter { it.canRead(user) }
        .map { 
            val agentData = it.jsonData().put("id", it.id)
            // Include tool metadata for UI display
            val tools = agentData.getJsonArray("tools")
            tools?.forEach { toolRef ->
                val toolObj = toolRef as JsonObject
                val toolConfig = toolObj.getJsonObject("config")
                when (toolObj.getString("type")) {
                    "request" -> {
                        val request = daoManager.requestDao.getById(toolConfig.getLong("id"))
                        if (request != null) {
                            toolConfig.put("name", request.jsonData().getString("name"))
                            toolConfig.put("description", request.jsonData().getString("description"))
                        }
                    }
                    "script" -> {
                        val script = daoManager.jobScriptDao.getById(toolConfig.getLong("id"))
                        if (script != null) {
                            toolConfig.put("name", script.jsonData().getString("name"))
                            toolConfig.put("description", script.jsonData().getString("description"))
                        }
                    }
                }
            }
            agentData
        }
    
    return result
        .put("requests", JsonArray(requests))
        .put("scripts", JsonArray(scripts))
        .put("agents", JsonArray(agents))  // New addition
}
```

#### 2. Update Collection Data Structure
**File**: Documentation update for collection API response
**Changes**: Document new agents field in collection response

```json
// Updated collection response format
{
  "id": 123,
  "name": "My Collection",
  "description": "...",
  "requests": [...],
  "scripts": [...],
  "agents": [
    {
      "id": 789,
      "name": "Support Agent",
      "description": "Handles customer support",
      "tools": [
        {
          "type": "request", 
          "config": {
            "id": 456,
            "name": "Get User Info",
            "description": "Retrieves user information by ID"
          }
        },
        {
          "type": "script", 
          "config": {
            "id": 789,
            "name": "Send Email",
            "description": "Sends email notification"
          }
        }
      ]
    }
  ]
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Collection API returns agents: `curl localhost:8080/api/collections`
- [ ] JSON response validates against expected schema
- [ ] Integration tests pass with agent data included

#### Manual Verification:
- [ ] GET /api/collections includes agents in response
- [ ] Agents appear with correct structure and data
- [ ] Access control applied (only agents user can read)
- [ ] No performance degradation with agent data

---

## Testing Strategy

### Unit Tests:
- **AgentDb**: Entity creation, JSON serialization/deserialization
- **AgentDao**: CRUD operations, collection querying
- **AgentRunner**: Dynamic tool creation, langchain4j integration
- **RequestTool/ScriptTool**: Tool execution, error handling
- **AgentRoute**: HTTP request handling, validation

### Integration Tests:
- **End-to-end agent creation and invocation**
- **Tool execution calling actual request/script services**
- **Collection integration with agent data**

### Manual Testing Steps:
1. Create collection with requests and scripts
2. Create agent with tools referencing those requests/scripts
3. Invoke agent and verify it can see individual tools
4. Test agent executing request tool - verify same behavior as direct request
5. Test agent executing script tool - verify same behavior as direct script
6. Test collection API returns agent data correctly
7. Test error scenarios (invalid agent, unauthorized access, tool failures)

## Performance Considerations

- **Tool Creation Overhead**: Dynamic tool creation happens on each invocation - consider caching if needed
- **langchain4j Memory Usage**: Monitor memory usage with multiple concurrent agent invocations
- **Database Queries**: Agent invocation requires multiple DB lookups - consider optimization
- **Request/Script Execution**: Existing performance characteristics apply to tool execution

## Migration Notes

- **Database Migration**: New agents table created automatically via ORMLite
- **Backward Compatibility**: No changes to existing request/script functionality
- **API Versioning**: New endpoints don't affect existing API contracts

## References

- Research document: `thoughts/shared/research/2025-09-07_15-45-17_ai-agents-implementation.md`  
- Existing patterns: `server/src/main/kotlin/com/espero/yaade/model/db/RequestDb.kt`
- Request execution: `server/src/main/kotlin/com/espero/yaade/services/RequestSender.kt:51-127`
- Script execution: `server/src/main/kotlin/com/espero/yaade/services/ScriptRunner.kt:57-131`
- Route patterns: `server/src/main/kotlin/com/espero/yaade/server/routes/RequestRoute.kt`