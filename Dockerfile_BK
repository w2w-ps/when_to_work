ARG wavemaker_version=latest

# Stage 1: Build the web application artifact
FROM wavemakerapp/app-builder:${wavemaker_version} as webapp-artifact

ADD ./ /usr/local/content/app

ARG profile
ENV profile=${profile}
ENV MAVEN_CONFIG=/root/.m2

# Copy custom npm config
COPY jenkins/.npmrc /root/.npmrc

# Copy custom maven settings
COPY jenkins/settings.xml /root/.m2/settings.xml

# ALSO override global maven settings
COPY jenkins/settings.xml /usr/share/maven/conf/settings.xml

# Force tools to use these configs
ENV NPM_CONFIG_USERCONFIG=/root/.npmrc

RUN cat /root/.m2/settings.xml
RUN cat /root/.npmrc

RUN --mount=type=cache,target=/root/.m2 \
    --mount=type=cache,target=/root/.npm \
    bash /usr/local/bin/wavemaker-build.sh full

# Stage 2: Runtime
FROM wavemakerapp/app-runtime-tomcat:${wavemaker_version}

COPY --from=webapp-artifact /usr/local/content/app/target/*.war /usr/local/tomcat/webapps/ROOT.war

