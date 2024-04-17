FROM node:18 as build

WORKDIR /usr/local/apps/citrineos

# Avoid copying everything at once in order to cache layers and prevent complete rebuild for any change

# Needed files for building the packages
COPY ./package.json ./
COPY ./tsconfig.build.json ./
# Can't start with installing workspace dependencies since root package.json depends on Server

#Build all packages
WORKDIR /usr/local/apps/citrineos/00_Base
COPY ./00_Base/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/01_Data
COPY ./01_Data/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/02_Util
COPY ./02_Util/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/Certificates
COPY ./03_Modules/Certificates/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/Configuration
COPY ./03_Modules/Configuration/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/EVDriver
COPY ../03_Modules/EVDriver/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/Monitoring
COPY ../03_Modules/Monitoring/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/Reporting
COPY ../03_Modules/Reporting/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/SmartCharging
COPY ../03_Modules/SmartCharging/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos/03_Modules/Transactions
COPY ../03_Modules/Transactions/ ./
RUN npm install && tsc --verbose

WORKDIR /usr/local/apps/citrineos
COPY ./Server/ ./Server/
COPY ./tsconfig.json ./
RUN npm install && tsc --build --verbose

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:18-slim
COPY --from=build /usr/local/apps/citrineos /usr/local/apps/citrineos

WORKDIR /usr/local/apps/citrineos

EXPOSE ${PORT}

CMD ["npm", "run", "start:local-docker"]
