// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineConfig, RegistrationStatusEnumType } from '@citrineos/base';
import path from 'path';

export function createLocalConfig() {
  return defineConfig({
    env: 'development',
    centralSystem: {
      host: '0.0.0.0',
      port: 8080,
    },
    modules: {
      certificates: {
        endpointPrefix: '/certificates',
      },
      configuration: {
        heartbeatInterval: 60,
        bootRetryInterval: 15,
        unknownChargerStatus: RegistrationStatusEnumType.Accepted,
        getBaseReportOnPending: true,
        bootWithRejectedVariables: true,
        autoAccept: true,
        endpointPrefix: '/configuration',
      },
      evdriver: {
        endpointPrefix: '/evdriver',
      },
      monitoring: {
        endpointPrefix: '/monitoring',
      },
      reporting: {
        endpointPrefix: '/reporting',
      },
      smartcharging: {
        endpointPrefix: '/smartcharging',
      },
      tenant: {
        endpointPrefix: '/tenant',
      },
      transactions: {
        endpointPrefix: '/transactions',
        costUpdatedInterval: 60,
      },
    },
    data: {
      sequelize: {
        host: 'localhost',
        port: 5432,
        database: 'citrine',
        dialect: 'postgres',
        username: 'citrine',
        password: 'citrine',
        storage: '',
        sync: false,
        alter: true,
      },
    },
    util: {
      cache: {
        memory: true,
      },
      messageBroker: {
        amqp: {
          url: 'amqp://guest:guest@localhost:5672',
          exchange: 'citrineos',
        },
      },
      fileAccess: {
        currentFileAccess: 's3Storage',
      },
      swagger: {
        path: '/docs',
        logoPath: path.resolve(
          path.dirname(__filename),
          '../../assets/logo.png',
        ),
        exposeData: true,
        exposeMessage: true,
      },
      directus: {
        host: '0.0.0.0',
        port: 8055,
        generateFlows: false,
        token: '-ssaT85n4S-wVD21LKOCDwvXN5PtnJc0',
      },
      networkConnection: {
        websocketServers: [
          {
            id: '0',
            securityProfile: 0,
            allowUnknownChargingStations: true,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8081,
            protocol: 'ocpp2.0.1',
          },
          {
            id: '1',
            securityProfile: 1,
            allowUnknownChargingStations: false,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8082,
            protocol: 'ocpp2.0.1',
          },
        ],
      },
      certificateAuthority: {
        v2gCA: {
          name: 'hubject',
          hubject: {
            baseUrl: 'https://open.plugncharge-test.hubject.com',
            tokenUrl:
              'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token',
            isoVersion: 'ISO15118-2',
          },
        },
        chargingStationCA: {
          name: 'acme',
          acme: {
            env: 'staging',
            accountKeyFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/acme_account_key.pem',
            ),
            email: 'test@citrineos.com',
          },
        },
      },
    },
    logLevel: 2, // debug
    maxCallLengthSeconds: 30,
    maxCachingSeconds: 30,
    ocpiServer: {
      host: '0.0.0.0',
      port: 8085,
    },
  });
}
