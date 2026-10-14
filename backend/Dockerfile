# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/personalearn.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Xmx350m -XX:+UseSerialGC -jar app.jar"]
