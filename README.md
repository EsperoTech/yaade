# Yaade - Yet Another API Development Environment

Yaade is an open-source, self-hosted, collaborative API development environment.

## Why did you develop Yaade?

When working with a team on an API I found that all teammembers have their own local collection of Postman requests that they use during development.
Everytime the API changes, all devs update their collection manually. Some don't get notified and wonder why their calls don't work anymore.
Therefore I was looking for a free and leightweight alternative to Postman where all the data would be stored on my own machine and could be securely accessed by my teammates.
There were a few candidates but non of them fullfiled all of my requirements, so I decided to build Yaade.

## Features

1. Manage users
2. Create and persist collections and REST requests

## Technology

1. SPA built with TypeScript, React and Vite.
2. Backend built with Kotlin.
3. H2 database.

## FAQ

### Will there be more features coming like Websockets, GraphQL, etc.?

There are only three reasons why I implement new features:

1. I need them myself.
2. People pay me to do it.
3. I have nothing else to do (rarely the case).

Besides that, feel free to implement new features yourself and open a pull requests.
