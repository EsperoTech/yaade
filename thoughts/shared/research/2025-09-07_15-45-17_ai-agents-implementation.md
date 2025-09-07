---
date: 2025-09-07T15:45:17Z
researcher: Claude
git_commit: 0b4dea7e9b140e029e29210c7694217b464eab41
branch: jr/ai-agents
repository: yaade
topic: "User-defined AI agents implementation with langchain4j"
tags: [research, codebase, ai-agents, langchain4j, collections, requests, scripts]
status: complete
last_updated: 2025-09-07
last_updated_by: Claude
---

# Research: User-defined AI agents implementation with langchain4j

**Date**: 2025-09-07T15:45:17Z
**Researcher**: Claude
**Git Commit**: 0b4dea7e9b140e029e29210c7694217b464eab41
**Branch**: jr/ai-agents
**Repository**: yaade

## Research Question
How to implement user-defined AI agents that can be configured, stored (like requests/scripts), edited with tools (requests/scripts), and invoked via API endpoints using langchain4j for dynamic agent parsing and execution?

## Summary
Yaade has a robust architecture perfect for implementing AI agents. The system uses Kotlin with Vert.x, ORMLite for database access, and JSON-based entity storage. Key findings: no existing langchain4j integration (clean slate), existing MCP server for AI integration, comprehensive script/request execution infrastructure, and established patterns for CRUD operations on collections/requests/scripts that can be extended for agents.

## Detailed Findings

### Database Architecture
Yaade uses a JSON-centric data model with ORMLite:
- **Collections**: Main organizational unit (`CollectionDb.kt:52-54`)
- **Requests**: HTTP requests stored with JSON data (`RequestDb.kt:72-111`)
- **Scripts**: JavaScript execution units (`JobScriptDb.kt`)
- **Pattern**: All entities store metadata in `ByteArray` JSON fields for flexibility

**Agent Entity Structure Recommendation**:
```kotlin
// server/src/main/kotlin/com/espero/yaade/model/db/AgentDb.kt
data class AgentDb(
    @DatabaseField(generatedId = true) val id: Long = 0,
    @DatabaseField(index = true) val collectionId: Long,
    @DatabaseField val version: String = "1.0",
    @DatabaseField val data: ByteArray
)
```

**Agent JSON Data Structure**:
```json
{
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries",
  "systemPrompt": "You are a helpful customer support agent...",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 1000,
  "tools": [
    {
      "type": "request",
      "id": 123,
      "name": "get_user_info",
      "description": "Retrieves user information by ID"
    },
    {
      "type": "script",
      "id": 456,
      "name": "send_email",
      "description": "Sends an email to the user"
    }
  ]
}
```

### Existing Collection/Request Architecture
The codebase follows a consistent layered architecture:

**DAO Layer** (`server/src/main/kotlin/com/espero/yaade/db/`):
- `CollectionDao.kt` - Collection data access
- `RequestDao.kt` - Request data access  
- `JobScriptDao.kt` - Script data access
- Pattern: Extend with `AgentDao.kt`

**API Layer** (`server/src/main/kotlin/com/espero/yaade/server/routes/`):
- `CollectionRoute.kt` - Collection CRUD endpoints
- `RequestRoute.kt` - Request CRUD endpoints
- `ScriptRoute.kt` - Script CRUD and execution endpoints
- Pattern: Add `AgentRoute.kt` for agent CRUD and invocation

**Service Layer** (`server/src/main/kotlin/com/espero/yaade/services/`):
- `RequestSender.kt` - HTTP request execution
- `ScriptRunner.kt` - JavaScript execution with GraalVM
- Pattern: Add `AgentRunner.kt` for langchain4j agent execution

### Request and Script Execution APIs - **REUSE EXISTING LOGIC**

**CRITICAL**: For AI agent implementation, **DO NOT** reimplement execution logic. Instead, leverage the existing APIs that already handle all complexity:

**HTTP Request Execution Logic** (`InvokeRoute.kt:12-38` calls `RequestSender.send()`):
- **Route Logic**: `InvokeRoute.invoke()` → `requestSender.send(data, collection, envName, user)`
- **Service Method**: `RequestSender.send()` does all the actual work
- **Agent Integration**: Call `requestSender.send()` directly from langchain4j tools
- **Benefits**: Same exact execution path as HTTP endpoint, zero duplication

```kotlin
// Agent tool calls the same service method as the HTTP endpoint
suspend fun executeRequestTool(requestId: Long, envName: String?): JsonObject {
    val request = daoManager.requestDao.getById(requestId)
    val collection = daoManager.collectionDao.getById(request.collectionId)
    // Call the SAME method that InvokeRoute.invoke() calls
    return requestSender.send(request.jsonData(), collection, envName, user)
}
```

**Script Execution Logic** (`ScriptRoute.kt:146-187` calls `ScriptRunner.run()`):
- **Route Logic**: `ScriptRoute.tokenRunScript()` → `run(id, script, collectionId, envName, groups, additionalEnvData)`
- **Service Method**: `ScriptRunner.run()` does all the actual work
- **Agent Integration**: Call `ScriptRunner.run()` directly from langchain4j tools
- **Benefits**: Same exact execution path as HTTP endpoint, zero duplication

```kotlin
// Agent tool calls the same service method as the HTTP endpoint
suspend fun executeScriptTool(scriptId: Long, envName: String?): JsonObject {
    val jobScript = daoManager.jobScriptDao.getById(scriptId)
    val scriptString = jobScript.jsonData().getString("script")
    // Call the SAME method that ScriptRoute.tokenRunScript() calls
    return scriptRunner.run(scriptId, scriptString, jobScript.collectionId, envName, ownerGroups, additionalEnvData)
}
```

**Why Reuse Service Methods (Not HTTP Endpoints)**:
1. **Direct Service Calls**: Call `requestSender.send()` and `scriptRunner.run()` directly
2. **Same Execution Path**: Identical logic as HTTP endpoints without HTTP overhead
3. **Complete Feature Parity**: All business logic, validation, permissions preserved
4. **No Duplication**: Zero reimplementation of complex execution logic
5. **Consistency**: Same behavior whether called from UI or agent
6. **Maintenance**: Changes to execution logic automatically apply to agents
7. **Performance**: Direct method calls, no HTTP round-trip

### API Endpoint Patterns

**Collection Retrieval** (`CollectionRoute.kt`):
- `GET /api/collections` returns all collections with nested data
- Collections include requests and scripts
- **Extension needed**: Include agents in collection response

**Service Methods to Reuse in Agent Tools**:
1. **Request Execution**: Call `RequestSender.send()` directly (same as `InvokeRoute.invoke()` does)
2. **Script Execution**: Call `ScriptRunner.run()` directly (same as `ScriptRoute.tokenRunScript()` does)

**Agent Tools Implementation Strategy**:
- **Request Tool**: Call `requestSender.send(requestData, collection, envName, user)` directly
- **Script Tool**: Call `scriptRunner.run(scriptId, script, collectionId, envName, groups, envData)` directly
- **Direct Service Calls**: Same method calls as HTTP routes, bypassing HTTP layer
- **Benefit**: 100% feature parity with existing UI functionality, maximum performance

### Current AI Integration (MCP Server)

**Existing MCP Integration** (`mcp/index.js`):
- Model Context Protocol server with tool calling
- Tools: `list_scripts`, `run_script`
- Connects to AI applications (Claude Desktop, Cursor)
- **Complementary**: MCP for external AI, langchain4j for internal agents

## Code References

- `server/src/main/kotlin/com/espero/yaade/model/db/CollectionDb.kt:52-54` - Collection ownership and access control
- `server/src/main/kotlin/com/espero/yaade/model/db/RequestDb.kt:72-111` - Request JSON data structure
- `server/src/main/kotlin/com/espero/yaade/services/RequestSender.kt:51-127` - HTTP request execution engine
- `server/src/main/kotlin/com/espero/yaade/services/ScriptRunner.kt:57-131` - Script execution engine
- `server/src/main/kotlin/com/espero/yaade/server/routes/InvokeRoute.kt:12-38` - Request invocation API
- `server/src/main/kotlin/com/espero/yaade/server/routes/ScriptRoute.kt:146-187` - Script execution API

## Architecture Insights

### Established Patterns
1. **JSON-Centric Storage**: All entities use flexible JSON data storage
2. **Collection-Based Organization**: Everything belongs to collections
3. **Layered Architecture**: Clear separation of DAO/Service/Route layers
4. **Async Execution**: Vert.x event bus for async processing
5. **Environment Variables**: Comprehensive variable interpolation system
6. **Access Control**: User/group-based permissions throughout

### langchain4j Integration Strategy
1. **Clean Slate**: No existing langchain4j dependencies - clean implementation
2. **Service Reuse Pattern**: langchain4j tools call `RequestSender.send()` and `ScriptRunner.run()` directly
3. **Async Support**: Vert.x integration with CompletableFuture patterns
4. **Environment Context**: Rich environment variable system for agent context
5. **Direct Method Calls**: Agent tools call the same service methods as HTTP routes
6. **Zero Logic Duplication**: All execution complexity handled by existing, tested code

### Recommended Implementation Approach

**Phase 1: Database and DAO Layer**
```kotlin
// AgentDb entity
// AgentDao with standard CRUD operations
// Database migration/table creation
```

**Phase 2: Service Layer with langchain4j**
```kotlin
// AgentRunner service
// Dynamic langchain4j agent creation from JSON config
// Tool registration for requests/scripts
// Agent execution with context injection
```

**Phase 3: API Layer**
```kotlin
// AgentRoute for CRUD operations
// Agent invocation endpoint
// Integration with collection retrieval
```

**Phase 4: Collection Integration**
```kotlin
// Modify CollectionRoute to include agents
// Agent management in collection context
// Tool assignment and configuration
```

## Historical Context (from thoughts/)

No relevant historical context found in thoughts/ directory regarding AI agents or langchain4j integration. This appears to be a new feature area.

## Related Research

This is the first research document on AI agents implementation in the yaade repository.

## Open Questions

1. **langchain4j Version**: Which version to use and dependency management?
2. **Model Integration**: How to handle different AI models (OpenAI, Anthropic, local)?
3. **Tool Security**: How to secure tool execution and prevent unauthorized access?
4. **Agent Persistence**: Should agents maintain conversation state between invocations?
5. **Concurrent Execution**: How to handle multiple agent invocations simultaneously?
6. **Error Handling**: How to handle langchain4j errors and timeouts?
7. **Resource Management**: How to limit agent resource usage (tokens, execution time)?