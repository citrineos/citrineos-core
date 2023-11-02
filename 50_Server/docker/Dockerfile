FROM node:18

# Create server directory
WORKDIR /usr/server

# Copy the package.json and package-lock.json (or yarn.lock) files into the container
COPY /50_Server/package*.json ./

# Copy the tsconfig.json file into the container
COPY /50_Server/tsconfig.json ./

# Copy the source code into the container
COPY /50_Server/src /usr/server/src

# Copy binaries from each module into the container
COPY /00_Base/citrineos-base-1.0.0.tgz /usr/00_Base/
COPY /01_Provisioning/citrineos-provisioning-1.0.0.tgz /usr/01_Provisioning/
COPY /02_Authorization/citrineos-authorization-1.0.0.tgz /usr/02_Authorization/
COPY /03_Availability/citrineos-availability-1.0.0.tgz /usr/03_Availability/
COPY /04_Transaction/citrineos-transaction-1.0.0.tgz /usr/04_Transaction/
COPY /05_Monitoring/citrineos-monitoring-1.0.0.tgz /usr/05_Monitoring/
COPY /10_Data/citrineos-data-1.0.0.tgz /usr/10_Data/
COPY /99_Util/citrineos-util-1.0.0.tgz /usr/99_Util/

# Install the project dependencies
RUN npm install

EXPOSE 8080
EXPOSE 8081

CMD [ "npm", "run", "start-unix:docker" ]