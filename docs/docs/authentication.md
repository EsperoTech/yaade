# Authentication

Yaade provides different mechanisms to inject authentication into your requests. This is useful if you want to test APIs that require authentication.
To add authentication to your request, open the `Auth` tab and check `Enabled`. Then configure your authentication mechanism. If you want to use the same authentication machanism for all requests in a collection, you can configure it in the `Auth` tab of the collection. If both, request and collection, have authentication enabled, the request authentication takes precedence.

::: info
All input fields in the authentication tab support environment variables. This means you can easily configure different values like username and password for different environments.
:::

## Basic Auth

Basic Auth is a simple way to authenticate your requests. It is a simple username and password combination that is sent in the request header. The authentication is provided in a base64 encoded string.

<table>
    <tr>
        <th>Key</th>
        <th>Description</th>
        <th>Example</th>
    </tr>
    <tr>
        <td>Username</td>
        <td>The username of the user</td>
        <td>admin</td>
    </tr>
    <tr>
        <td>Password</td>
        <td>The password of the user</td>
        <td>password</td>
    </tr>
</table>

<table>
    <tr>
        <th>Result Header</th>
    </tr>
    <tr>
        <td>Authorization: Basic YWRtaW46cGFzc3dvcmQ=</td>
    </tr>
</table>

## OAuth2

OAuth2 is a protocol that allows a user to grant a third-party web site or application access to the user's protected resources, without necessarily revealing their long-term credentials or even their identity. The user grants access by authenticating and authorizing the third-party application to access the user's account. Yaade supports different OAuth2 flows called "Grant Types". For all flows you need to first generate a token by filling out the necessary information and then click on `Generate Token`. When a token is generated, and authentication is enabled, the token is automatically injected into the request header.

### Authorization Code

The Authorization Code flow is used to obtain an access token by exchanging an authorization code with the authorization server. This flow requires user consent in the browser. When executing this flow in Yaade, you will be redirected to the authorization server to grant access. After granting access, the authorization server will redirect you back to Yaade with the authorization code. Yaade will then exchange the authorization code for an access token.

::: warning
To use the Authorization Code flow, you must add the URL where Yaade is running to the redirect URIs of your OAuth2 application.
:::

<table>
    <tr>
        <th>Key</th>
        <th>Description</th>
        <th>Example</th>
    </tr>
    <tr>
        <td>Auth URL</td>
        <td>The URL to the authorization server</td>
        <td>https://example.com/oauth2/authorize</td>
    </tr>
    <tr>
        <td>Token URL</td>
        <td>The URL to the token endpoint</td>
        <td>https://example.com/oauth2/token</td>
    </tr>
    <tr>
        <td>Client ID</td>
        <td>The client ID of the OAuth2 application</td>
        <td>123456</td>
    </tr>
    <tr>
        <td>Client Secret</td>
        <td>The client secret of the OAuth2 application</td>
        <td>abcdef</td>
    </tr>
    <tr>
        <td>Scope</td>
        <td>The scope of the access request</td>
        <td>read write</td>
    </tr>
</table>

<table>
    <tr>
        <th>Result Header</th>
    </tr>
    <tr>
        <td>Authorization: Bearer ey...</td>
    </tr>
</table>

### Client Credentials

The Client Credentials flow is used to obtain an access token by using the client ID and client secret. This flow is used when the client is the resource owner. The client sends the client ID and client secret to the authorization server and receives an access token. No browser redirect is required.

<table>
    <tr>
        <th>Key</th>
        <th>Description</th>
        <th>Example</th>
    </tr>
    <tr>
        <td>Token URL</td>
        <td>The URL to the token endpoint</td>
        <td>https://example.com/oauth2/token</td>
    </tr>
    <tr>
        <td>Client ID</td>
        <td>The client ID of the OAuth2 application</td>
        <td>123456</td>
    </tr>
    <tr>
        <td>Client Secret</td>
        <td>The client secret of the OAuth2 application</td>
        <td>abcdef</td>
    </tr>
    <tr>
        <td>Scope</td>
        <td>The scope of the access request</td>
        <td>read write</td>
    </tr>
</table>

<table>
    <tr>
        <th>Result Header</th>
    </tr>
    <tr>
        <td>Authorization: Bearer ey...</td>
    </tr>
</table>

### Password

The Password flow is used to obtain an access token by using the username and password of the user. This flow is used when the client is the resource owner. The client sends the username and password to the authorization server and receives an access token. No browser redirect is required.

<table>
    <tr>
        <th>Key</th>
        <th>Description</th>
        <th>Example</th>
    </tr>
    <tr>
        <td>Token URL</td>
        <td>The URL to the token endpoint</td>
        <td>https://example.com/oauth2/token</td>
    </tr>
    <tr>
        <td>Client ID</td>
        <td>The client ID of the OAuth2 application</td>
        <td>123456</td>
    </tr>
    <tr>
        <td>Client Secret</td>
        <td>The client secret of the OAuth2 application</td>
        <td>abcdef</td>
    </tr>
    <tr>
        <td>Scope</td>
        <td>The scope of the access request</td>
        <td>read write</td>
    </tr>
    <tr>
        <td>Username</td>
        <td>The username of the user</td>
        <td>admin</td>
    </tr>
    <tr>
        <td>Password</td>
        <td>The password of the user</td>
        <td>password</td>
    </tr>
</table>

<table>
    <tr>
        <th>Result Header</th>
    </tr>
    <tr>
        <td>Authorization: Bearer ey...</td>
    </tr>
</table>
