# Dockerfile assumes that it is in Server/deploy.with.ocpi.Dockerfile being run with context ../ and with citrineos-ocpi
# being in same directory as citrineos-core.
FROM node:18 as build

# COPY OCPI
WORKDIR /usr/local/apps/citrineos-ocpi
COPY ./citrineos-ocpi .

# COPY CORE
WORKDIR /usr/local/apps/citrineos-core
COPY ./citrineos-core .

# INSTALL OCPI
WORKDIR /usr/local/apps/citrineos-ocpi
RUN npm i

# INSTALL CORE
WORKDIR /usr/local/apps/citrineos-core
RUN npm i

# BUILD OCPI
WORKDIR /usr/local/apps/citrineos-ocpi
RUN npm run build

# BUILD CORE
WORKDIR /usr/local/apps/citrineos-core
RUN npm run build
RUN npm rebuild bcrypt --build-from-source && npm rebuild deasync --build-from-source

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:18-slim
COPY --from=build /usr/local/apps /usr/local/apps

WORKDIR /usr/local/apps/citrineos-core

EXPOSE ${PORT}

CMD ["npm", "run", "start-docker-cloud"]
