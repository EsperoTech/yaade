# Response Scripts

Response scripts are executed after sending a request. They are written in basic JavaScript but with
limited functionality. Basic operations like assignments and additions are normally accessible. Also some extra functions are available to interact with the response.

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
console.log("hello world")
const x = math.PI
```

## Commands

Listed below are special commands available in response scripts.

### Set Environment Variables

The  `env.set` function allows you to set a variable in the currently selected environment.

```javascript
env.set("hello", "world")
env.set("foo", "bar" + "buz")
```

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

### JSON Path

The `jp` function allows you to traverse a JSON object using a JSON-Path expression. Check out the [original proposal](https://goessner.net/articles/JsonPath/) or the [jsonpath npm library](https://www.npmjs.com/package/jsonpath) for detailed examples.

::: info
jp only returns the first value that matches the JSON path expression
:::

```javascript
env.set("token", jp("$.access_token", res.body))
```

### Get Environment Variables

Just like you are able to set an environment varialbe `env.get` allows you to get an existing variable.

```javascript
const foo = env.get("bar")
```