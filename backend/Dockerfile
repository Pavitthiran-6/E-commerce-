# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Cache maven dependencies in a separate layer to avoid downloading them on every deploy
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# JVM flags optimised for Render free tier (512 MB RAM):
# -Xmx350m        : max heap 350 MB
# -Xms128m        : start heap 128 MB (avoids re-sizing pauses during boot)
# -Xss512k        : thread stack size
# -XX:CICompilerCount=2 : limit JIT compiler threads
# -XX:TieredStopAtLevel=1 : interpreter-only mode speeds up startup significantly
# -XX:+UseSerialGC : serial GC uses less overhead than default G1 on small heaps
# -Djava.security.egd=file:/dev/./urandom : faster SecureRandom init (important for JWT)
ENTRYPOINT ["java", \
  "-Xmx350m", \
  "-Xms128m", \
  "-Xss512k", \
  "-XX:CICompilerCount=2", \
  "-XX:TieredStopAtLevel=1", \
  "-XX:+UseSerialGC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
