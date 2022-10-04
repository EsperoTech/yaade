# Environments

Environments allow you to reuse special variables across your entire collection. You might store a long URL in an environment and reuse it in every request. Environments are also handy if you have different deployments, like production and staging. With environments you do not have to change the request everytime you want to use a different deployment target. Yaade provides a sophisticated environment interpolation system. To create a new environment click **••• > Environment** next to the desired collection.

## Environment Variables

Environments consist of multiple environment variables. Each variable has a `key` and a `value`. When sending a request, keys in your request are interpolated to the corresponding value.

To reference a specific environment variable in your request, simply put `${key}` anywhere in your request. Variables can be used in any part of your request, e.g. URL, headers, query parameters or the body.

For example, if you use an environment that has the following variables:

<table>
    <tr>
        <th>Key</th>
        <th>Value</th>
    </tr>
    <tr>
        <td>host</td>
        <td>https://example.com</td>
    </tr>
    <tr>
        <td>path</td>
        <td>/test</td>
    </tr>
</table>

Now if you have an URL of the form `${host}${path}` it will resolve to `https://example.com/test` when sending your request.

Environment variables are also recursively resolved, which makes it possible to reference variables in other variables. Let's extend the example above:

<table>
    <tr>
        <th>Key</th>
        <th>Value</th>
    </tr>
    <tr>
        <td>url</td>
        <td>${host}${path}</td>
    </tr>
</table>

Now you can set your URL to `${url}` and it will again resolve to `https://example.com/test`.

::: tip
Environment Variables use `JavaScript Template literals` under the hood. To find out what other cool things you can do with them, check out the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
:::

## Special Operators

It is possible to interpolate some special operators for example to generate random data. To use a special operation, simply use it inside an interpolation like `${$r.integer(0,10)}`.

Say your URL is something like `https://example.com/${$r.integer(0,10)}` when sending this request the operation will be executed and the result would be `https://example.com/9`.

::: warning
Special operators are executed on every request. So the interpolated data of your request may change every time you send the request.
:::

You can also use special operators in your environment variables.

<table>
    <tr>
        <th>Key</th>
        <th>Value</th>
    </tr>
    <tr>
        <td>url</td>
        <td>${$r.uuid4()}</td>
    </tr>
</table>

### Available Operators

Below is a list of available operators.

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

#### Env

Inside an interpolation operation you can access other variables from this environment by referencing `$env`. This is useful when you want to conditionally set variables or use them in other computations. Say we have the following environment:

<table>
    <tr>
        <th>Key</th>
        <th>Value</th>
    </tr>
    <tr>
        <td>auth</td>
        <td>bearer</td>
    </tr>
    <tr>
        <td>bearerPrefix</td>
        <td>Bearer</td>
    </tr>
</table>

`${$env.auth === "bearer" ? $env.bearerPrefix : "Basic"}` results in `Bearer`.

## Proxies

A proxy executes the actual request. Yaade currently supports the browser extension (Extension) and the server inside the docker container (server) as proxies.

### Extension

The default proxy is your browser extension. This proxy allows you to execute requests to your machine's localhost. Note that the extension has to be installed and configured in order to send requests to it. If the extension is not installed or wrongly configured, an error message will pop up when trying to send a request.

To enable this proxy, select `Extension` in your environment.

### Server

The server proxy is the docker container that Yaade is running in. This proxy allows you to use secrets. Read the [section for secrets](#secrets) for more details.

To enable this proxy, select `Server` in your environment.

## Secrets

Secrets provide a mechanism to store sensitive information even more securely. After a secret is created, it can never be read again by a client. It is stored safely inside Yaade's database. Because of this, secrets are interpolated by the server and can therefore only be used if your proxy is set to `Server`.

Analogous to environment variables, secrets can be used anywhere in your request by adding `$S{key}` (note the `S` after the $-sign).

::: warning
Secrets do not use template literals, so they do not have the functionality of variables. Only simple interpolation is supported.
:::

To understand how secrets can be used, take the following example.

**Variables**

<table>
    <tr>
        <th>Key</th>
        <th>Value</th>
    </tr>
    <tr>
        <td>accessKey</td>
        <td>some-key</td>
    </tr>
</table>

**Secrets**

<table>
    <tr>
        <th>Key</th>
        <th>Value</th>
    </tr>
    <tr>
        <td>secretKey</td>
        <td>xxx</td>
    </tr>
</table>

Now if you would have a header `Authorization` with the value

`${accessKey}:$S{secretKey}`

the client would interpolate it to

`some-key:$S{secretKey}`

and the server would in turn interpolate it to

`some-key:xxx`

before sending the request.