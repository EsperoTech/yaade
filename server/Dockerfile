FROM amazoncorretto:18
RUN mkdir /app

EXPOSE 9339

COPY /build/libs/dependencies/*.jar /app/libs/
COPY /build/resources/main /app/resources
COPY /build/classes/kotlin/main /app/classes
COPY /build/classes/java/main /app/classes
COPY /build/libs/*.jar /app/libs/

ENV CLASSPATH=/app/classes:/app/resources:/app/libs/*

# Entry point to start the application
ENTRYPOINT ["java", "com.espero.yaade.MainKt"]
