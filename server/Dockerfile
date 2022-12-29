FROM adoptopenjdk/openjdk11:jdk-11.0.11_9-alpine-slim

RUN mkdir /app

ADD /build/libs/yaade-server-1.0-SNAPSHOT.jar /app/yaade.jar

EXPOSE 9339

ENV YAADE_BASE_PATH
ENV YAADE_ADMIN_USERNAME

CMD [ "java", "-jar", "/app/yaade.jar"]
