FROM openjdk:17
EXPOSE 8081
ADD target/backstage-jenkins.jar backstage-jenkins
ENTRYPOINT [ "java", "-jar", "/backstage-jenkins.jar" ]