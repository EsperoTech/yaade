package com.espero.yaade.server.auth

import com.espero.yaade.db.DaoManager
import com.espero.yaade.model.db.UserDb
import com.espero.yaade.server.errors.ServerError
import io.vertx.core.Vertx
import io.vertx.core.http.HttpClientOptions
import io.vertx.core.json.JsonArray
import io.vertx.core.json.JsonObject
import io.vertx.core.json.pointer.JsonPointer
import io.vertx.ext.auth.oauth2.OAuth2Auth
import io.vertx.ext.auth.oauth2.OAuth2Options
import io.vertx.ext.auth.oauth2.providers.AmazonCognitoAuth
import io.vertx.ext.auth.oauth2.providers.AzureADAuth
import io.vertx.ext.auth.oauth2.providers.GithubAuth
import io.vertx.ext.auth.oauth2.providers.KeycloakAuth
import io.vertx.ext.auth.oauth2.providers.OpenIDConnectAuth
import io.vertx.ext.web.Router
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.handler.AuthenticationHandler
import io.vertx.ext.web.handler.MultiTenantHandler
import io.vertx.ext.web.handler.OAuth2AuthHandler
import io.vertx.ext.web.handler.impl.MultiTenantHandlerImpl
import io.vertx.kotlin.coroutines.await
import org.apache.http.HttpStatus
import java.net.MalformedURLException
import java.net.URL


class AuthHandler(private val vertx: Vertx, private val daoManager: DaoManager) : AuthenticationHandler {

    private lateinit var router: Router
    private lateinit var delegate: MultiTenantHandler

    // loginProviders is the list of external login-providers that is provided to the client before login
    private var loginProviders = JsonArray()

    // providerMap is used to get the profile information and other attributes for a logged-in end-user
    private var providerMap = mutableMapOf<String, OAuth2Auth>()

    // providerConfigMap is used to populate the user object after login with information like groups
    private var providerConfigMap = mutableMapOf<String, JsonObject>()

    suspend fun init(router: Router, authConfig: JsonObject) {
        this.router = router
        providerMap = mutableMapOf()
        providerConfigMap = mutableMapOf()
        loginProviders = JsonArray()
        delegate = MultiTenantHandlerImpl({ ctx ->
            ctx.request().getParam("providerId")
        }, "providerId")

        val localAuthProvider = LocalAuthProvider(daoManager)
        val localAuthHandler = LocalAuthHandler(localAuthProvider)
        delegate.addDefaultHandler(localAuthHandler)

        applyAuthConfig(authConfig, false)
    }

    // testAuthConfig is used to test if a given auth configuration is valid or not. It does not change the handler
    suspend fun testAuthConfig(authConfig: JsonObject) {
        applyAuthConfig(authConfig, true)
    }

    private suspend fun applyAuthConfig(authConfig: JsonObject, isTest: Boolean) {
        val providers = authConfig.getJsonArray("providers")

        providers.forEach {
            val c: JsonObject = it as JsonObject
            when (val provider = c.getString("provider")) {
                "cognito" -> doCognito(c, isTest)
                "azureAD" -> doAzureAD(c, isTest)
                "github" -> doGithub(c, isTest)
                "keycloak" -> doKeycloak(c, isTest)
                "oidc-discovery" -> doOidcDiscovery(c, isTest)
                "oauth2" -> doOauth2(c, isTest)
                else -> throw RuntimeException("Unknown provider: $provider")
            }
        }
    }

    private fun validateFields(params: JsonObject) {
        val fields = params.getJsonObject("fields") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"fields must not be null")
        fields.getString("username") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"username-field must not be null")
    }

    private fun addAuthProvider(auth: OAuth2Auth, config: JsonObject, isTest: Boolean) {
        val params: JsonObject =
            config.getJsonObject("params") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "params must not be null")
        validateFields(params)
        val callbackUrl = params.getString("callbackUrl") ?: throw ServerError(
            HttpStatus.SC_BAD_REQUEST,
            "callbackUrl must not be null"
        )
        val callbackPath: String
        try {
            callbackPath = URL(callbackUrl).path
        } catch (e: MalformedURLException) {
            throw ServerError(HttpStatus.SC_BAD_REQUEST, "callbackUrl is not a valid URL.")
        }
        if (callbackPath == "") throw ServerError(HttpStatus.SC_BAD_REQUEST, "callback path must not be empty")

        val id = config.getString("id") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST, "id must not be null")
        var result = OAuth2AuthHandler.create(vertx, auth, callbackUrl)

        params.getJsonArray("scopes")?.forEach {
            result = result.withScope(it as String)
        }

        // NOTE: exit here before changing anything if we are only testing
        if (isTest) return

        result.setupCallback(router.route(callbackPath))
        router.route(callbackPath).handler(result)
        delegate.addTenantHandler(id, result)
        providerMap[id] = auth
        providerConfigMap[id] = config

        val cc = config.copy()
        cc.remove("params")
        loginProviders.add(cc)
    }

    private suspend fun doCognito(c: JsonObject, isTest: Boolean) {
        val params: JsonObject = c.getJsonObject("params")

        val userPoolId = params.getString("poolId") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"poolId must not be null")
        val poolSplit = userPoolId.split("_")
        if (poolSplit.size != 2) {
            throw ServerError(HttpStatus.SC_BAD_REQUEST, "Pool-id must be of form <region>_<id>. Got $userPoolId")
        }
        val region = poolSplit[0]
        val clientId = params.getString("clientId") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"clientId must not be null")
        val clientSecret = params.getString("clientSecret") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"clientSecret must not be null")
        val site = params.getString("site") ?: "https://cognito-idp.$region.amazonaws.com/{tenant}"

        val options = OAuth2Options()
            .setClientId(clientId)
            .setClientSecret(clientSecret)
            .setTenant(userPoolId)
            .setSite(site)

        val authProvider = AmazonCognitoAuth.discover(vertx, options).await()

        addAuthProvider(authProvider, c, isTest)
    }

    private fun doGithub(c: JsonObject, isTest: Boolean) {
        val params: JsonObject = c.getJsonObject("params")
        val options =
            HttpClientOptions()

        val clientId = params.getString("clientId") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"clientId must not be null")
        val clientSecret = params.getString("clientSecret") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"clientSecret must not be null")

        val authProvider =
            GithubAuth.create(vertx, clientId, clientSecret, options)

        addAuthProvider(authProvider, c, isTest)
    }

    private suspend fun doAzureAD(c: JsonObject, isTest: Boolean) {
        val params: JsonObject = c.getJsonObject("params")
        val clientId = params.getString("clientId") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"clientId must not be null")
        val clientSecret = params.getString("clientSecret") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"clientSecret must not be null")
        val tenant = params.getString("tenant") ?: throw ServerError(HttpStatus.SC_BAD_REQUEST,"guid must not be null")

        val options = OAuth2Options()
            .setClientId(clientId)
            .setClientSecret(clientSecret)
            .setTenant(tenant)
            .setSite("https://login.microsoftonline.com/{tenant}/v2.0")

        val authProvider = AzureADAuth.discover(vertx, options).await()

        addAuthProvider(authProvider, c, isTest)
    }

    private suspend fun doKeycloak(c: JsonObject, isTest: Boolean) {
        val params: JsonObject = c.getJsonObject("params")
        val options = OAuth2Options(params)
        val authProvider = KeycloakAuth.discover(vertx, options).await()

        addAuthProvider(authProvider, c, isTest)
    }

    private suspend fun addOauth2Tenant(c: JsonObject, isOidc: Boolean, isTest: Boolean) {
        val params: JsonObject = c.getJsonObject("params")
        val options = OAuth2Options(params)
        val authProvider = if (isOidc)
            try {
                OpenIDConnectAuth.discover(vertx, options).await()
            } catch (t: Throwable) {
                throw ServerError(HttpStatus.SC_BAD_REQUEST, "Discovery failed: " + t.message)
            }

        else
            OAuth2Auth.create(vertx, options)

        addAuthProvider(authProvider, c, isTest)
    }

    private suspend fun doOidcDiscovery(config: JsonObject, isTest: Boolean) = addOauth2Tenant(config, true, isTest)

    private suspend fun doOauth2(config: JsonObject, isTest: Boolean) = addOauth2Tenant(config, false, isTest)

    override fun handle(ctx: RoutingContext) {
        val user = ctx.user()
        val path = ctx.request().path()
        if (path.contains("/api/loginProviders")) {
            ctx.end(loginProviders.encode())
            return
        }
        if (user == null)
            delegate.handle(ctx)
        else
            getUser(ctx)
    }

    private fun getUser(ctx: RoutingContext) {
        val principal = ctx.user().principal()
        if (principal.containsKey("username"))
            ctx.end(ctx.user().principal().encode())
        else
            getUserInfo(ctx)
    }

    private fun getUserInfo(ctx: RoutingContext) {
        val providerId = ctx.request().getParam("providerId")
        if (providerId == null) {
            ctx.fail(500, RuntimeException("missing providerId"))
            return
        }
        val provider = providerMap[providerId]
        if (provider == null) {
            ctx.fail(500, RuntimeException("missing provider"))
            return
        }
        val config = providerConfigMap[providerId]
        if (config == null) {
            ctx.fail(500, RuntimeException("missing provider configuration"))
            return
        }
        provider.userInfo(ctx.user())
            .onSuccess {
                try {
                    updateUser(config, ctx, it)
                    ctx.redirect("/")
                } catch (t: Throwable) {
                    ctx.session().destroy()
                    ctx.setUser(null)
                    ctx.fail(500, t)
                }
            }.onFailure {
                ctx.session().destroy()
                ctx.setUser(null)
                ctx.fail(500, it)
            }
    }

    private fun updateUser(config: JsonObject, ctx: RoutingContext, userInfo: JsonObject) {
        val fields = config.getJsonObject("params")?.getJsonObject("fields")
            ?: throw RuntimeException("missing fields in provider config")

        val usernamePointer = fields.getString("username")
            ?: throw RuntimeException("missing username in fields in provider config")
        val username = (JsonPointer.from(usernamePointer).queryJson(userInfo)
            ?: throw RuntimeException("Username not found: $usernamePointer")) as String

        val providerId = config.getString("id")

        val groupsPointer = fields.getString("groups")
            ?: throw RuntimeException("missing groups in fields in provider config")
        val rawGroups: Any = JsonPointer.from(groupsPointer).queryJson(userInfo)
            ?: JsonArray()

        val groups = when (rawGroups) {
            is String -> JsonArray().add(rawGroups)
            is JsonArray -> rawGroups
            else -> throw RuntimeException("Unexpected groups type: $rawGroups")
        }
        val filterPattern = config.getJsonObject("params").getJsonObject("fields").getString("groupsFilter")
            ?: ".*"
        val filteredGroups = filterGroups(groups, filterPattern)
        val defaultGroups =
            config.getJsonObject("params").getJsonObject("fields").getJsonArray("defaultGroups") ?: JsonArray()
        val allGroups = filteredGroups + defaultGroups
        val externalUsername = UserDb.getExternalUsername(username, providerId)
        // NOTE: external user get their internal DB entry to be able to save settings
        val userDb = daoManager.userDao.getByUsername(externalUsername)
            ?: daoManager.userDao.createExternalUser(username, providerId)
        userDb.patchData(JsonObject().put("groups", allGroups))

        // NOTE: update on every new login, since external groups and other attributes could have changed
        daoManager.userDao.update(userDb)

        val sessionUser = userDb.toSessionUser()

        sessionUser.principal().put("username", username)
        ctx.setUser(sessionUser)
    }

    private fun filterGroups(groups: JsonArray, filterPattern: String): JsonArray {
        val re = filterPattern.toRegex()
        val result = groups.filter { re.containsMatchIn(it as String) }
        return JsonArray(result)
    }
}
