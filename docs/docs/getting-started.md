# Getting Started

This section will help you start a basic Yaade container from the ground up.

## Step 1: Install Docker

Before you can start with Yaade make sure that Docker is installed on your machine. Follow [this guide](https://docs.docker.com/get-docker/) to get started.

## Step 2: Start the container

Create a new docker volume to persist your data between container restarts.

```bash
$ docker volume create yaade
```

Finally start the container on port 9339.

```bash
$ docker run -d --restart=always -p 9339:9339 \
    -e YAADE_ADMIN_USERNAME=admin -v yaade:/app/data \
    --name yaade esperotech/yaade:latest
```

## Step 3: Open Yaade

If you started the container locally, you can now visit `http://localhost:9339`. If you do not have access to a browser on your machine you can do a quick health check to ensure Yaade is up and running.

```bash
$ curl http://localhost:9339/api/health
```

## Step 4: Upgrade

To upgrade the docker container with a new version, first stop the running container, pull the latest version and start a new container with the old volume.

```bash
$ docker rm -f yaade
$ docker pull esperotech/yaade:latest
$ docker run -d --restart=always -p 9339:9339 \
    -e YAADE_ADMIN_USERNAME=admin -v yaade:/app/data \
    --name yaade esperotech/yaade:latest
```
