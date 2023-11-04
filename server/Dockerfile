FROM amazoncorretto:11
RUN mkdir /app

ADD /build/libs/yaade-server-1.0-SNAPSHOT.jar /app/yaade.jar

EXPOSE 9339

CMD [ "java", "-jar", "/app/yaade.jar"]
