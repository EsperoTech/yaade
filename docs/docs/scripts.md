# Scripts

Yaade provides the ability to execute scripts written in JavaScript. There are three types of
scripts:

1. Request Scripts
   - Run before a request is executed
2. Response Scripts
   - Run after a request is executed
3. Job Scripts
   - Can be scheduled periodically or run manually

While these three types of scripts share most of their functionality, there are some differences in the context in which they are executed. The following sections will provide an overview of the available commands and the execution order of the scripts.

## Script Syntax

Scripts are defined in regular JavaScript. This means you can use all the features of JavaScript like variables, loops, and functions.

```javascript
// valid commands
const x = 2 * 5
let y = "hello world"
const s = y.split(" ")
if (s.length === 2) {
    y = `foo=${s[0]}`
}
const j = s.join("_")
for (let i = 0; i < 10; i++) {
    x += i
}
```

But there are some commands that are blocked on purpose to prevent malicious behavior:

```javascript
// invalid commands
import "..."
window.localStorage
console.log("hello world")
const cookies = document.cookie
alert("hello world")
```

::: warning
Because Yaade uses JavaScript template literals to interpolate environment variables, template literals inside your scripts might be overwritten by your environment if keys match. It is therefore generally discouraged to use them in scripts.
:::

## Special Commands

Yaade Scripts provide some special commands to interact with the environment, the request, and the response. The following sections will provide an overview of the available commands.

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
request id and environment name. The structure of this info is `[<script type>: <request id> - <environment>] <logging-content>`. When logging in job scripts, the logs are stored in the job history.

```javascript
const o = {"foo": "bar"}
log("hello world", o)
// output: [Request Script: 2 - dev] hello world {foo: 'bar'}
```

### DateTime

The `DateTime` object allows you to work with dates and times in scripts. It is a direct reference to the `DateTime` object of [Luxon](https://moment.github.io/luxon/#/). Check out the [Luxon example page](https://moment.github.io/luxon/demo/global.html) for detailed examples.

```javascript
const now = DateTime.utc().toISO()
// result: 2023-03-26T12:43:37.956Z
```

#### random-js

We support `random-js` by referencing `$r`. You can read the full random-js docs [here](https://github.com/ckknight/random-js). Below are some useful commands taken from their documentation.

- `$r.integer(min, max)`: Produce an integer within the inclusive range [`min`, `max`]. `min` can be at its minimum -9007199254740992 (2 ** 53). `max` can be at its maximum 9007199254740992 (2 ** 53). The special number `-0` is never returned.
- `$r.real(min, max, inclusive)`: Produce a floating point number within the range [`min`, `max`) or [`min`, `max`]. Uses 53 bits of randomness.
- `$r.die(sideCount)`: Same as `r.integer(1, sideCount)`
- `$r.uuid4()`: Produce a [Universally Unique Identifier](http://en.wikipedia.org/wiki/Universally_unique_identifier) Version 4.
- `$r.string(length)`: Produce a random string using numbers, uppercase and lowercase letters, `_`, and `-` of length `length`.
- `$r.string(length, pool)`: Produce a random string using the provided string `pool` as the possible characters to choose from of length `length`.
- `$r.hex(length)` or `r.hex(length, false)`: Produce a random string comprised of numbers or the characters `abcdef` of length `length`.
- `$r.hex(length, true)`: Produce a random string comprised of numbers or the characters `ABCDEF` of length `length`.
- `$r.date(start, end)`: Produce a random `Date` within the inclusive range of [`start`, `end`]. `start` and `end` must both be `Date`s.

### Base64 encoding/decoding

You can encode and decode strings to and from base64.

- Encode to base64: `btoa("hello:world")` results in `aGVsbG86d29ybGQ=`.
- Decode a string from base64 use `atob('aGVsbG86d29ybGQ=')` results in `hello:world`.

### Execute another Request

A very powerful tool is to execute other requests from within a script. This gives you the ability to chain requests and build complex workflows.
The signature of the command is very simple: 

```javascript
const exec: (requestId: number, envName?: string) => Promise<unknown>
```

Because `exec` is asynchronous one can use `await` to wait for the result of the command.

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

The result of a successful exec call is the response of the target request. It is the same object as the `res` object in response scripts.

```javascript
const res = await exec(12)
const headers = res.headers
const contentType = headers["Content-Type"]
const body = res.body // is of type string
const status = res.status
if (status === 200) {
    env.set("type", contentType)
}
```

### Tests

We use Jasmine to define test suites in scripts. Tests can only be used in response and job scripts.

The following example shows how to write a simple test suite:

```javascript
describe('Create and retrieve an entity', function() {
    it('should create an entity', async function() {
        // post entity request
        const res = await exec(1783, env.name);
        expect(res.status).toBe(201);
        const id = jp("$.id", res.body)
        env.set("id", id);
    });

    it('should retrieve the entity', async function() {
        // get entity request (id is injected from the environment)
        const res = await exec(1784, env.name);
        expect(res.status).toBe(200);
        const resId = jp("$.id", res.body)
        const envId = env.get("id")
        expect(resId).toBe(envId)
    });
});
```

Here are some basic Jasmine operations that you can use. If you want to use more advanced features, please refer to the [Jasmine documentation](https://jasmine.github.io/).

```javascript
describe("Basic Jasmine Test Suite", function() {

  // 1. Simple Expectations
  it("should check if true is true", function() {
    expect(true).toBe(true);
  });

  it("should check if a number equals another number", function() {
    var a = 10;
    expect(a).toBe(10);
  });

  it("should check if two objects are equal", function() {
    var obj1 = { name: "John", age: 30 };
    var obj2 = { name: "John", age: 30 };
    expect(obj1).toEqual(obj2);
  });

  // 2. Matchers
  it("should check if a value is truthy", function() {
    var a = true;
    expect(a).toBeTruthy();
  });

  it("should check if a value is null", function() {
    var a = null;
    expect(a).toBeNull();
  });

  it("should check if an array contains a specific item", function() {
    var fruits = ["apple", "banana", "mango"];
    expect(fruits).toContain("banana");
  });

  // 3. Setup and Teardown
  var value;
  
  beforeEach(function() {
    value = 42;
  });

  afterEach(function() {
    value = 0;
  });

  it("should use the value set in beforeEach", function() {
    expect(value).toBe(42);
  });

  it("should reset value after test runs", function() {
    value = 100;
    expect(value).toBe(100);
  });

  it("should reset value after the test has been run", function() {
    expect(value).toBe(42);  // Value should be reset by afterEach
  });
});
```

## Request Scripts

Request scripts are run before a request is executed. This makes them useful if you need
to build your environment before executing a request. For example when a request needs a
fresh access token you can use the request script to fetch the access token and put it
into the environment to be used by the request. Request scripts are always executed in the browser of the calling user. To add a request script, select a request and go to the `Request Script` tab.

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

Response scripts are run after a request is executed. They are usually used to extract
information from the response and validate it. You could for example use the response
script to check if the status code was 200 or else throw an error. Response scripts are 
always executed in the browser of the calling user. To add a response script, select a request and go to the `Response Script` tab.

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

## Execution Order of Request and Response Scripts

There are four types of scripts that are executed in the following order:

1. Collection-level Request Script
2. Request Script
3. Response Script
4. Collection-level Response Script

As other requests can be executed in the request scripts, the scripts are executed in a depth-first manner. This means that if a request script executes another request, the request script of the target request is executed before the response script of the source request.

Example:
    
```javascript
// Request Script of Request 1
await exec(2)
// ... more code
```

Now if request 1 is executed, the execution order is as follows:

1. Collection-level Request Script of Request 1
2. First part of Request Script of Request 1
3. Collection-level Request Script of Request 2
4. Request Script of Request 2
5. Response Script of Request 2
6. Collection--level Response Script of Request 2
7. The rest of Request Script of Request 1
8. Response Script of Request 1
9. Collection-level Response Script of Request 1

## Job Scripts

Job Scripts are server-side scripts that are executed in an isolated GraalVM JavaScript environment on the server. This allows for script execution without user interaction. Job
scripts can be scheduled using cron expressions for recurring tasks such as smoke tests, cleanup jobs, or data processing.

Each run of a job script creates a result that contains the set of logs generated during the execution as well as a test suite. The result can be viewed in the job history.

### Create a new Job Script

Just like a request, a job script is always part of a collection. To create a new job script, click on the **•••** button in the collection sidebar and select `New Job Script`. Enter the name
of your script and click `Create`.

### Manual Run

You can manually run a job script by clicking the `RUN` button in the top right corner of the
script panel. This will execute the script and show the result in the job history.

### Cron Scheduling

Job scripts can be scheduled using cron expressions. We use **UNIX cron expressions** to define the schedule of a job. The cron expression consists of five fields that represent the following:

1. Seconds (0-59)
2. Minutes (0-59)
3. Hours (0-23)
4. Day of the month (1-31)
5. Month (1-12)

The following cron expression runs the job every day at 3:30 AM:

```plaintext
30 3  *  *  *
┬  ┬  ┬  ┬  ┬
│  │  │  │  └───── Day of the week (any)
│  │  │  └─────────── Month (any)
│  │  └───────────────── Day of the month (any)
│  └─────────────────────── Hour (3 AM)
└───────────────────────────── Minute (30)
```

The following cron expression runs the job every Monday at 3:30 AM:

```plaintext
30 3 * * 1
```

The following cron expression runs the job every 15 minutes:

```plaintext
*/15 * * * *
```

To enable a scheduled job, click the `▶` play button. To disable the job, click the `⏸` pause button. Select the environment in which the job should be executed. Choose `NO_ENV` if you don't need an environment.

### Callback

You can register a callback that is executed after the job script has finished. This is useful when automating workflows. The callback function has access to all the test results of the job script.

```javascript
registerCallback(async (res) => {
    env.set("res", res)
    if (!res.success || res.jasmineReport?.status === "failed") {
        // you can execute another request here, for example
        // have a request that sends a notification to a slack channel
        await exec(12)
    }
})
```

```typescript
type JasmineExpectation = {
  matcherName: string;
  message: string;
  stack: string;
  passed: boolean;
};

type JasmineSpec = {
  id: string;
  description: string;
  fullName: string;
  parentSuiteId: string | null;
  failedExpectations: JasmineExpectation[];
  passedExpectations: JasmineExpectation[];
  deprecationWarnings: any[];
  pendingReason: string;
  duration: number;
  properties: any | null;
  debugLogs: any | null;
  status: string;
};

type JasmineSuite = {
  id: string;
  description: string;
  fullName: string;
  parentSuiteId: string | null;
  failedExpectations: any[];
  deprecationWarnings: any[];
  duration: number;
  properties: any | null;
  status: string;
  specs: JasmineSpec[];
};

type JasmineReport = {
  suites: JasmineSuite[];
  status: string;
};

type Log = {
  message: string;
  timestamp: string;
};

type TestReport = {
  success: boolean;
  executionTime: number;
  jasmineReport: JasmineReport;
  logs: Log[];
  error: string | null;
  envName: string;
};
```
