FROM adoptopenjdk/openjdk11:jdk-11.0.11_9-alpine-slim

RUN mkdir /app

ADD /build/libs/yaade-server-1.0-SNAPSHOT.jar /app/yaade.jar

EXPOSE 9339

CMD [ "java", "-jar", "/app/yaade.jar"]
