FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY lib ./lib
COPY src ./src
RUN mvn clean compile

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/classes ./classes
COPY lib ./lib
CMD ["java", "-DFCGI_PORT=9000", "-cp", "classes:lib/fastcgi-lib.jar", "org.example.Main"]
