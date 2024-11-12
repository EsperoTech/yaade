FROM amazoncorretto:17
RUN mkdir /app

EXPOSE 9339

COPY /build/libs/dependencies/*.jar /app/libs/
COPY /build/resources/main /app/resources
COPY /build/classes/kotlin/main /app/classes
COPY /build/classes/java/main /app/classes
COPY /build/libs/*.jar /app/libs/

ENV CLASSPATH=/app/classes:/app/resources:/app/libs/*
ENV YAADE_HEAP_SIZE=""

# Entry point to start the application
ENTRYPOINT ["sh", "-c", "if [ -z \"$YAADE_HEAP_SIZE\" ]; then java com.espero.yaade.MainKt; else java -Xmx${YAADE_HEAP_SIZE} com.espero.yaade.MainKt; fi"]
