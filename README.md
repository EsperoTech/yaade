# <span style="color:#48bb78">Yaade</span> - Yet Another API Development Environment

<span style="color:#48bb78">Yaade</span> is an open-source, self-hosted, collaborative API development environment.

## 🤔 Why did you develop <span style="color:#48bb78">Yaade</span>?


When working with a team on an API I found that all teammembers have their own local collection of Postman requests that they use during development.
Everytime the API changes, all devs update their collection manually. Some don't get notified and wonder why their calls don't work anymore.
Therefore I was looking for a free and leightweight alternative to Postman where all the data would be stored on my own machine and could be securely accessed by my teammates.
There were a few candidates but non of them fullfiled all of my requirements, so I decided to build <span style="color:#48bb78">Yaade</span>.

## 🌟 Features

1. Self-hosted, data never leaves your own server.
2. Persistent even across container restarts
3. Easy single-file data import / export when moving to a new server
4. Requests are executed on your machine so you can call localhost as well as remote servers

## Install

To have the best experience with Yaade run the docker container on your sever and install the browser extension on your local machine.

### 1. 🐋 Docker

```bash
$ docker volume create yaade
$ docker run -d --restart=always -p 9339:9339 -e YAADE_ADMIN_USERNAME=admin -v yaade:/app/data --name yaade yaade:latest
```

### 2. 🔧 Extension

Yaade uses a browser extension as a proxy so enable CORS requests. Simply install the extension, open it and input your server URL, eg. `https://yaade.example.com/`.

## Technology

1. SPA built with TypeScript, React and Vite.
2. Backend built with Kotlin.
3. H2 file-based database.
4. Browser extension with plain JavaScript.

## FAQ

### Will there be more features coming like Websockets, GraphQL, etc.?

There are only three reasons why I implement new features:

1. I need them myself.
2. People pay me to do it.
3. I have nothing else to do (rarely the case).

Besides that, feel free to implement new features yourself and open a pull requests.
