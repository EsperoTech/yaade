# Scripts

Yaade provides the ability to execute scripts written in a sandboxed version of JavaScript. It is sandboxed because most JavaScript functionality
is deactivated, like calls to `window` or `document` to prevent potentially malicious code.

Some valid functionality includes:

```javascript
const x = 2 * 5
let y = "hello world"
const s = y.split(" ")
if (s.length === 2) {
    y = `foo=${s[0]}`
}
const j = s.join("_")
```

But the following commands are not valid:

```javascript
import "..."
window.localStorage
console.log("hello world")
const cookies = document.cookie
```

::: warning
Because Yaade uses JavaScript template literals to interpolate environment variables, template literals inside your scripts might be overwritten by your environment if keys match. It is therefore generally discouraged to use them in scripts.
:::

Currently Request Scripts and Response Scripts are supported.

## Special Commands

Listed below are special commands available in scripts run in Yaade.

### Set Environment Variables

The  `env.set` function allows you to set a variable in the currently selected environment.

```javascript
env.set("hello", "world")
env.set("foo", "bar" + "buz")
```

### Get Environment Variables

Just like you are able to set an environment variable `env.get` allows you to get an existing variable.

```javascript
const foo = env.get("bar")
```

### JSON Path

The `jp` function allows you to traverse a JSON object using a JSON-Path expression. Check out the [original proposal](https://goessner.net/articles/JsonPath/) or the [jsonpath npm library](https://www.npmjs.com/package/jsonpath) for detailed examples.

::: info
jp only returns the first value that matches the JSON path expression
:::

```javascript
env.set("token", jp("$.access_token", res.body))
```

### Logging

The `log` function provides a basic way for logging. It logs into the console and prepends some information about execution environment, like
request id and environment name. The structure of this info is `[<script type>: <request id> - <environment>] <logging-content>`.

```javascript
const o = {"foo": "bar"}
log("hello world")
// output: [Request Script: 2 - dev] hello world {foo: 'bar'}
```

### DateTime

The `DateTime` object allows you to work with dates and times in scripts. It is a direct reference to the `DateTime` object of [Luxon](https://moment.github.io/luxon/#/). Check out the [Luxon example page](https://moment.github.io/luxon/demo/global.html) for detailed examples.

```javascript
const now = DateTime.utc().toISO()
// result: 2023-03-26T12:43:37.956Z
```

## Request Scripts

Request scripts are executed before sending a request. Following are commands that can exclusively be used in request scripts.

:::warning
Request scripts require version 1.4 of the extension and currently only support the extension proxy.
:::

### Execute another Request

Request scripts allow you to execute other requests before the actual request is sent. This provides a powerful tool to chain requests.
The signature of the command is very simple: `const exec: (requestId: number, envName?: string) => Promise<unknown>`. Because `exec` is asynchronous
one can use `await` to wait for the result of the command.

```javascript
// A simple example to extract a JWT from the response of another request
const res = await exec(15, env.name)
if (res.status === 200) {
    env.set("token", jp("$.accessToken", res.body))
}
```

::: info
The id of a request can be found by clicking on the options of a request in the sidebar and then clicking `Copy ID`.
:::

The environment name should match an existing environment in the collection of the request to be executed. To use the same name as the currently selected environment of the source request, use `env.name`. If left blank, no environment will be used for interpolation.

::: info
Yaade also executes the request and response script of the target request. This means you can build a chain of request to be executed.
Note that to prevent exec loops, a max. depth of **5 requests** is supported before the exec command fails. It is also possible to manipulate the
environment of the target request via the response script of the target request.
:::

The result of a successful exec call is the response of the target request. It contains the body as a string, headers as an object with keys and values and status code as integer.

```javascript
const res = await exec(12)
const headers = res.headers
const contentType = headers["Content-Type"]
const body = res.body
const status = res.status
if (status === 200) {
    env.set("type", contentType)
}
```

:::warning
The exec command will execute all request using the proxy of the original request's selected environment. This is because switching proxies between requests could result in secret leaking. This means that if the source request uses the Extension proxy, all calls to exec, even the ones in subsequent request scripts, cannot make use of secrets. Vice versa if the proxy is set to Server, then no request can be made against localhost.
:::

### Access the Request

The `req` object exposes the request that will be sent. The request itself is immutable though and can only be changed by changing the environment.
The request script is executed **before** the interpolation step, therefore the `req` object won't contain the resolved environment variables.

```javascript
const uri = req.uri // string of the request URI
const headers = req.headers // map of key value pairs
const body = req.body // body as string
const method = req.method // string of the request method for REST requests
```

## Response Scripts

Response scripts are executed after a request has been sent. Following are commands that can exclusively be used in response scripts.

### Access the Response

The `res` object exposes the response received when executing the request. It contains the body as a string, headers as an object with keys and values and status code as integer.

```javascript
const headers = res.headers
const contentType = headers["Content-Type"]
const body = res.body
const status = res.status
if (status === 200) {
    env.set("type", contentType)
}
```
