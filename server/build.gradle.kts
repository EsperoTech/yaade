import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.5.0"
    id("java")
    id("org.openapi.generator") version "5.3.0"
}

group = "com.espero"
version = "1.0-SNAPSHOT"

val vertxVersion = "4.2.4"

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("io.vertx:vertx-stack-depchain:$vertxVersion"))
    implementation("io.vertx:vertx-web")
    implementation("io.vertx:vertx-lang-kotlin")
    implementation("io.vertx:vertx-lang-kotlin-coroutines")
    implementation("io.vertx:vertx-web-openapi")
    implementation("io.vertx:vertx-web-validation")
    implementation("io.vertx:vertx-auth-jwt")

    implementation("com.h2database:h2:1.4.200")
    implementation("com.zaxxer:HikariCP:5.0.1")
    implementation("com.j256.ormlite:ormlite-core:4.48")
    implementation("com.j256.ormlite:ormlite-jdbc:4.48")

    implementation(kotlin("stdlib-jdk8"))
    implementation("org.slf4j:slf4j-simple:1.7.30")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.13.1")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.13.1")
    implementation("com.password4j:password4j:1.5.4")

    testImplementation(kotlin("test-junit5"))
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.6.0")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.6.0")
}

tasks.test {
    useJUnitPlatform()
}

tasks.withType<Jar> {

    manifest {
        attributes["Main-Class"] = "com.espero.yaade.MainKt"
    }

    from(sourceSets.main.get().output)

    dependsOn(configurations.runtimeClasspath)
    from({
        configurations.runtimeClasspath.get().filter { it.name.endsWith("jar") }.map { zipTree(it) }
    })
}

tasks.withType<KotlinCompile>() {
    kotlinOptions.jvmTarget = "11"
}
