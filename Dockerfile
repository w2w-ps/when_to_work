FROM wavemakerapp/app-runtime-tomcat:latest
COPY target/*.war /usr/local/tomcat/webapps/ROOT.war
