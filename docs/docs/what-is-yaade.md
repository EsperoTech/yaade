# What is Yaade?

Yaade (pronounced /dʒeɪd/ like the mineral) stands for "Yet Another API Development Environment". It is an open-source, self-hosted, collaborative API development environment.

## Why did you develop Yaade?

I was looking for a self-hosted Postman alternative so that API collections can easily be shared between teammates. Even though popular solutions like Hoppscotch exist, their self-hosted app does not come with authentication and relies on Firebase for persistency. Yaade is developed from the ground up with self-hosting and security in mind. That means sensitive information in API requests can safely be stored on your own server!

## Noteable features

1. Self-hosted: data never leaves your own server
2. Multi-user: manage users and their permissions, supports OAuth2 and OIDC
3. Persistent: even across container or server restarts
4. Easy single-file data import / export
5. Requests are executed on your machine so you can call localhost as well as remote servers
6. Request description (documentation) with Markdown
7. Request/Response scripts
8. Most importantly: dark mode default
