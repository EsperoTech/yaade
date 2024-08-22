# Users & Groups

With Yaade you can manage users and groups locally or with external authentication providers using OAuth2 and OIDC.

## Groups

Groups determine the permissions of users. A colletion can have a list of groups. Only users in one of these groups can see and edit the collection.

## Local User management

Local users are managed in **⚙️ > Users > Local**. You can add a new user by filling in the form on top of the list. Note that usernames must be unique. Groups are whitespace separated.

::: warning
A new user always has the default password `password`. Make sure to always change it to something more secure on first login.
:::

To make a user an admin, simply add the user to the group `admin`. Note that there is no concept like super-admin. Once a user is an admin he has all permissions.

## External User management

Yaade provides external user management using OAuth2 and OIDC. Since configuration options differ between providers this configuration is simply a big JSON object.

To add a new provider, add a new JSON object to the "providers" list.


### Example 

```json
{
    "providers": [{
        "id": "some-unique-id",
        "label": "Login with Cognito",
        "provider": "cognito",
        "params": {
            "clientId": "your-client-id",
            "clientSecret": "your-client-secret",
            "callbackUrl": "http://localhost:9339/callback-cognito",
            "fields": {
                "username": "/username",
                "groups": "/cognito:groups",
                "groupsFilter": "*.yaade",
                "defaultGroups": ["my-group"]
            },
            "scopes": ["openid", "email"]
        }
    }]
}
```

### Required Fields

`"id"` is a unique identifier for your provider

`"label"` is the label shown on the login screen

`"provider"` the provider to use, see below for what providers are available

`"params"` contains special provider-based parameters

### Required OAuth2 Params

`"clientId"` the client ID of your OAuth2 application

`"clientSecret"` the client secret of your OAuth2 application

`"callbackUrl"` the callback URL of your OAuth2 application.

::: warning
The path of the callback URL must be unique for every provider!
:::

`"fields"` contains information on how to parse a user's JWT access token

## Optional OAuth2 Params

`"scopes"` is a JSON array of strings of the scopes to request. Different providers have different scopes. Some providers don't require you to set scopes manually.

### Required OAuth2 Fields

`"username"` JSON path to the username

`"groups"` JSON path to the groups

### Optional OAuth2 Fields

`"filter"` RegEx to filter groups found in the `groups`-field

`"defaultGroups"` a set of groups that every user of this provider receives

## Providers

There are some preconfigured providers but you can also configure other OIDC or OAuth2 providers manually.

### AWS Cognito

`"provider": "cognito"`

This provider connects to a Cognito user pool.

#### Custom Params

`poolId` the user pool ID of

#### Example

```json
"params": {
    "poolId": "eu-central-1_KLALDK3D",
    ...
}
```

### AzureAD

`"provider": "azureAD"`

This provider connects to Azure AD.

#### Custom Params

`tenant` the tenant ID of your AzureAD application

#### Example

```json
"params": {
    "tenant": "ba5b0c35-eb3a-4fca-cca5-i45fce590a",
    ...
},
"scopes": ["openid"],
...
```

### Keycloak

`"provider": "keycloak"`

This provider connects to Keycloak.

#### Custom Params

`site` the URL of the Keycloak instance

#### Example

```json
"params": {
    "site": "https://keycloak.example.com/realms/test",
    ...
},
"scopes": ["openid"],
...
```

### Custom Providers

Since Yaade uses Vert.x under the hood, it is possible to configure custom provider's using `OAuth2Options`. You can find more informtaion on the available configuration params [here](https://vertx.io/docs/vertx-auth-oauth2/java/) and [here](https://vertx.io/docs/apidocs/io/vertx/ext/auth/oauth2/OAuth2Options.html).

#### Open ID Connect

`"provider": "oidc-discovery"`

#### OAuth2

`"provider": "oauth2"`
