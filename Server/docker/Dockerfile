FROM node:18 as base

# To work from package-lock.json for consistency, replace 'package' with 'package*' and 'install' with 'ci'
# This will not work for package-lock files generated on Windows machines.

# Build citrineos-base module
FROM base as citrineos-base-builder
COPY /00_Base/package.json /usr/00_Base/
RUN npm install --ignore-scripts=true --prefix /usr/00_Base

COPY /00_Base/tsconfig.json /usr/00_Base/
COPY /00_Base/src /usr/00_Base/src
RUN npm run build --prefix /usr/00_Base
RUN cd /usr/00_Base && npm pack

# Build citrineos-data module
FROM base as citrineos-data-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY /01_Data/package.json /usr/01_Data/
RUN npm install --ignore-scripts=true --prefix /usr/01_Data

COPY /01_Data/tsconfig.json /usr/01_Data/
COPY /01_Data/src /usr/01_Data/src
RUN npm run build --prefix /usr/01_Data
RUN cd /usr/01_Data && npm pack 

# Build citrineos-util module
FROM base as citrineos-util-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY /02_Util/package.json /usr/02_Util/
RUN npm install --ignore-scripts=true --prefix /usr/02_Util

COPY /02_Util/tsconfig.json /usr/02_Util/
COPY /02_Util/src /usr/02_Util/src
RUN npm run build --prefix /usr/02_Util
RUN cd /usr/02_Util && npm pack

# Build citrineos-certificates module
FROM base as citrineos-certificates-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/Certificates/package.json /usr/03_Modules/Certificates/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/Certificates

COPY /03_Modules/Certificates/tsconfig.json /usr/03_Modules/Certificates/
COPY /03_Modules/Certificates/src /usr/03_Modules/Certificates/src
RUN npm run build --prefix /usr/03_Modules/Certificates
RUN cd /usr/03_Modules/Certificates && npm pack

# Build citrineos-configuration module
FROM base as citrineos-configuration-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/Configuration/package.json /usr/03_Modules/Configuration/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/Configuration

COPY /03_Modules/Configuration/tsconfig.json /usr/03_Modules/Configuration/
COPY /03_Modules/Configuration/src /usr/03_Modules/Configuration/src
RUN npm run build --prefix /usr/03_Modules/Configuration
RUN cd /usr/03_Modules/Configuration && npm pack

# Build citrineos-evdriver module
FROM base as citrineos-evdriver-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/EVDriver/package.json /usr/03_Modules/EVDriver/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/EVDriver

COPY /03_Modules/EVDriver/tsconfig.json /usr/03_Modules/EVDriver/
COPY /03_Modules/EVDriver/src /usr/03_Modules/EVDriver/src
RUN npm run build --prefix /usr/03_Modules/EVDriver
RUN cd /usr/03_Modules/EVDriver && npm pack

# Build citrineos-monitoring module
FROM base as citrineos-monitoring-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/Monitoring/package.json /usr/03_Modules/Monitoring/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/Monitoring

COPY /03_Modules/Monitoring/tsconfig.json /usr/03_Modules/Monitoring/
COPY /03_Modules/Monitoring/src /usr/03_Modules/Monitoring/src
RUN npm run build --prefix /usr/03_Modules/Monitoring
RUN cd /usr/03_Modules/Monitoring && npm pack

# Build citrineos-reporting module
FROM base as citrineos-reporting-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/Reporting/package.json /usr/03_Modules/Reporting/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/Reporting

COPY /03_Modules/Reporting/tsconfig.json /usr/03_Modules/Reporting/
COPY /03_Modules/Reporting/src /usr/03_Modules/Reporting/src
RUN npm run build --prefix /usr/03_Modules/Reporting
RUN cd /usr/03_Modules/Reporting && npm pack

# Build citrineos-smartcharging module
FROM base as citrineos-smartcharging-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/SmartCharging/package.json /usr/03_Modules/SmartCharging/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/SmartCharging

COPY /03_Modules/SmartCharging/tsconfig.json /usr/03_Modules/SmartCharging/
COPY /03_Modules/SmartCharging/src /usr/03_Modules/SmartCharging/src
RUN npm run build --prefix /usr/03_Modules/SmartCharging
RUN cd /usr/03_Modules/SmartCharging && npm pack

# Build citrineos-transactions module
FROM base as citrineos-transactions-builder
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY /03_Modules/Transactions/package.json /usr/03_Modules/Transactions/
RUN npm install --ignore-scripts=true --prefix /usr/03_Modules/Transactions

COPY /03_Modules/Transactions/tsconfig.json /usr/03_Modules/Transactions/
COPY /03_Modules/Transactions/src /usr/03_Modules/Transactions/src
RUN npm run build --prefix /usr/03_Modules/Transactions
RUN cd /usr/03_Modules/Transactions && npm pack

# Final stage to assemble the server
FROM base as final-stage
WORKDIR /usr/server

# Copy .tgz files from each builder stage
COPY --from=citrineos-base-builder /usr/00_Base/*.tgz /usr/00_Base/
COPY --from=citrineos-data-builder /usr/01_Data/*.tgz /usr/01_Data/
COPY --from=citrineos-util-builder /usr/02_Util/*.tgz /usr/02_Util/
COPY --from=citrineos-certificates-builder /usr/03_Modules/Certificates/*.tgz /usr/03_Modules/Certificates/
COPY --from=citrineos-configuration-builder /usr/03_Modules/Configuration/*.tgz /usr/03_Modules/Configuration/
COPY --from=citrineos-evdriver-builder /usr/03_Modules/EVDriver/*.tgz /usr/03_Modules/EVDriver/
COPY --from=citrineos-monitoring-builder /usr/03_Modules/Monitoring/*.tgz /usr/03_Modules/Monitoring/
COPY --from=citrineos-reporting-builder /usr/03_Modules/Reporting/*.tgz /usr/03_Modules/Reporting/
COPY --from=citrineos-smartcharging-builder /usr/03_Modules/SmartCharging/*.tgz /usr/03_Modules/SmartCharging/
COPY --from=citrineos-transactions-builder /usr/03_Modules/Transactions/*.tgz /usr/03_Modules/Transactions/

COPY /Server/package.json ./
RUN npm install --ignore-scripts=true
RUN npm rebuild bcrypt --build-from-source
RUN npm rebuild deasync --build-from-source

COPY /Server/tsconfig.json ./
COPY /Server/src ./src
RUN npm run build

EXPOSE 8080
EXPOSE 8081
EXPOSE 8082

CMD [ "npm", "run", "start-unix:docker" ]