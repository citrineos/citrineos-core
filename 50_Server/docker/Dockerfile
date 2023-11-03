FROM node:18 as base

# Build citrineos-base module
FROM base as citrineos-base-builder
COPY /00_Base/package*.json /usr/00_Base/
RUN npm ci --ignore-scripts=true --prefix /usr/00_Base

COPY /00_Base/tsconfig.json /usr/00_Base/
COPY /00_Base/src /usr/00_Base/src
RUN npm run build --prefix /usr/00_Base
RUN cd /usr/00_Base && npm pack

# Build citrineos-data module
FROM base as citrineos-data-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY /10_Data/package*.json /usr/10_Data/
RUN npm ci --ignore-scripts=true --prefix /usr/10_Data

COPY /10_Data/tsconfig.json /usr/10_Data/
COPY /10_Data/src /usr/10_Data/src
RUN npm run build --prefix /usr/10_Data
RUN cd /usr/10_Data && npm pack 

# Build citrineos-util module
FROM base as citrineos-util-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY /99_Util/package*.json /usr/99_Util/
RUN npm ci --ignore-scripts=true --prefix /usr/99_Util

COPY /99_Util/tsconfig.json /usr/99_Util/
COPY /99_Util/src /usr/99_Util/src
RUN npm run build --prefix /usr/99_Util
RUN cd /usr/99_Util && npm pack

# Build citrineos-provisioning module
FROM base as citrineos-provisioning-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/10_Data/*.tgz /usr/10_Data/
COPY --from=citrineos-util-builder /usr/99_Util/*.tgz /usr/99_Util/
COPY /01_Provisioning/package*.json /usr/01_Provisioning/
RUN npm ci --ignore-scripts=true --prefix /usr/01_Provisioning

COPY /01_Provisioning/tsconfig.json /usr/01_Provisioning/
COPY /01_Provisioning/src /usr/01_Provisioning/src
RUN npm run build --prefix /usr/01_Provisioning
RUN cd /usr/01_Provisioning && npm pack

# Build citrineos-authorization module
FROM base as citrineos-authorization-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/10_Data/*.tgz /usr/10_Data/
COPY --from=citrineos-util-builder /usr/99_Util/*.tgz /usr/99_Util/
COPY /02_Authorization/package*.json /usr/02_Authorization/
RUN npm ci --ignore-scripts=true --prefix /usr/02_Authorization

COPY /02_Authorization/tsconfig.json /usr/02_Authorization/
COPY /02_Authorization/src /usr/02_Authorization/src
RUN npm run build --prefix /usr/02_Authorization
RUN cd /usr/02_Authorization && npm pack

# Build citrineos-availability module
FROM base as citrineos-availability-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/10_Data/*.tgz /usr/10_Data/
COPY --from=citrineos-util-builder /usr/99_Util/*.tgz /usr/99_Util/
COPY /03_Availability/package*.json /usr/03_Availability/
RUN npm ci --ignore-scripts=true --prefix /usr/03_Availability

COPY /03_Availability/tsconfig.json /usr/03_Availability/
COPY /03_Availability/src /usr/03_Availability/src
RUN npm run build --prefix /usr/03_Availability
RUN cd /usr/03_Availability && npm pack

# Build citrineos-transaction module
FROM base as citrineos-transaction-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/10_Data/*.tgz /usr/10_Data/
COPY --from=citrineos-util-builder /usr/99_Util/*.tgz /usr/99_Util/
COPY /04_Transaction/package*.json /usr/04_Transaction/
RUN npm ci --ignore-scripts=true --prefix /usr/04_Transaction

COPY /04_Transaction/tsconfig.json /usr/04_Transaction/
COPY /04_Transaction/src /usr/04_Transaction/src
RUN npm run build --prefix /usr/04_Transaction
RUN cd /usr/04_Transaction && npm pack

# Build citrineos-monitoring module
FROM base as citrineos-monitoring-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/10_Data/*.tgz /usr/10_Data/
COPY --from=citrineos-util-builder /usr/99_Util/*.tgz /usr/99_Util/
COPY /05_Monitoring/package*.json /usr/05_Monitoring/
RUN npm ci --ignore-scripts=true --prefix /usr/05_Monitoring

COPY /05_Monitoring/tsconfig.json /usr/05_Monitoring/
COPY /05_Monitoring/src /usr/05_Monitoring/src
RUN npm run build --prefix /usr/05_Monitoring
RUN cd /usr/05_Monitoring npm pack

# Final stage to assemble the server
FROM base as final-stage
WORKDIR /usr/server

# Copy .tgz files from each builder stage
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/10_Data/*.tgz /usr/10_Data/
COPY --from=citrineos-util-builder /usr/99_Util/*.tgz /usr/99_Util/
COPY --from=citrineos-provisioning-builder /usr/01_Provisioning/*.tgz /usr/01_Provisioning/
COPY --from=citrineos-authorization-builder /usr/02_Authorization/*.tgz /usr/02_Authorization/
COPY --from=citrineos-availability-builder /usr/03_Availability/*.tgz /usr/03_Availability/
COPY --from=citrineos-transaction-builder /usr/04_Transaction/*.tgz /usr/04_Transaction/
COPY --from=citrineos-monitoring-builder /usr/05_Monitoring/*.tgz /usr/05_Monitoring/

COPY /50_Server/package*.json ./
RUN npm ci --ignore-scripts=true

COPY /50_Server/tsconfig.json ./
COPY /50_Server/src ./src
RUN npm run build

EXPOSE 8080
EXPOSE 8081

CMD [ "npm", "run", "start-unix:docker" ]