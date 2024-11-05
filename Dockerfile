# Stage 1: Build the client
FROM node:18-slim AS client-builder
WORKDIR /build
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build the server
FROM amazoncorretto:17-alpine AS server-builder
WORKDIR /build
COPY server/ ./
COPY --from=client-builder /build/dist ./src/main/resources/webroot

# Change output directory to /build directly
RUN ./gradlew clean build -g /build/.gradle -p /build && \
    cp -r build/* . && \
    rm -rf build

# Stage 3: Final runtime image
FROM amazoncorretto:17-alpine

# Install required packages and create non-root user
RUN addgroup -S yaade && \
    adduser -S -G yaade -h /home/yaade -s /sbin/nologin yaade && \
    mkdir /app && \
    chown yaade:yaade /app

WORKDIR /app

# Copy built artifacts from server-builder
COPY --from=server-builder --chown=yaade:yaade /build/libs/dependencies/*.jar /app/libs/
COPY --from=server-builder --chown=yaade:yaade /build/resources/main /app/resources
COPY --from=server-builder --chown=yaade:yaade /build/classes/kotlin/main /app/classes
COPY --from=server-builder --chown=yaade:yaade /build/classes/java/main /app/classes
COPY --from=server-builder --chown=yaade:yaade /build/libs/*.jar /app/libs/

# Set environment variables
ENV CLASSPATH=/app/classes:/app/resources:/app/libs/*
ENV YAADE_HEAP_SIZE=""

# Switch to non-root user
USER yaade

# Expose port
EXPOSE 9339

# Entry point to start the application
ENTRYPOINT ["sh", "-c", "if [ -z \"$YAADE_HEAP_SIZE\" ]; then java com.espero.yaade.MainKt; else java -Xmx${YAADE_HEAP_SIZE} com.espero.yaade.MainKt; fi"]