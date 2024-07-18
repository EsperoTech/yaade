import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.6.21"
    id("java")
    id("com.github.johnrengelman.shadow") version "1.2.3"
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}


group = "com.espero"
version = "1.0-SNAPSHOT"

val vertxVersion = "4.5.1"
val graalVMVersion = "23.1.1";

repositories {
    mavenCentral()
    gradlePluginPortal()
}

dependencies {
    implementation(platform("io.vertx:vertx-stack-depchain:$vertxVersion"))
    implementation("io.vertx:vertx-web")
    implementation("io.vertx:vertx-lang-kotlin")
    implementation("io.vertx:vertx-lang-kotlin-coroutines")
    implementation("io.vertx:vertx-web-openapi")
    implementation("io.vertx:vertx-web-validation")
    implementation("io.vertx:vertx-auth-oauth2")
    implementation("io.vertx:vertx-web-client")

    implementation("com.h2database:h2:1.4.200")
    implementation("com.zaxxer:HikariCP:5.0.1")
    implementation("com.j256.ormlite:ormlite-core:4.48")
    implementation("com.j256.ormlite:ormlite-jdbc:4.48")

    implementation(kotlin("stdlib-jdk8"))
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.13.1")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.13.1")
    implementation("com.password4j:password4j:1.7.1")
    implementation("net.lingala.zip4j:zip4j:2.9.1")
    implementation("io.swagger.parser.v3:swagger-parser-v3:2.1.19")

    implementation("org.apache.commons:commons-text:1.9")

    testImplementation(kotlin("test-junit5"))
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.6.0")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.6.0")

    implementation("org.graalvm.truffle:truffle-api:$graalVMVersion")
    implementation("org.graalvm.truffle:truffle-runtime:$graalVMVersion")
    implementation("org.graalvm.truffle:truffle-compiler:$graalVMVersion")
    implementation("org.graalvm.polyglot:polyglot:$graalVMVersion")
    implementation("org.graalvm.polyglot:js:$graalVMVersion")
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

    duplicatesStrategy = DuplicatesStrategy.INCLUDE
}

tasks.withType<KotlinCompile> {
    kotlinOptions.jvmTarget = "17"
}
