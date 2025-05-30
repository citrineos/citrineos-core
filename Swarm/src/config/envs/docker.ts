// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  defineConfig,
  OCPP1_6,
  OCPP2_0_1,
  type SystemConfig,
} from '@citrineos/base';

export function createDockerConfig(): SystemConfig {
  return defineConfig({
    env: 'development',
    centralSystem: {
      host: '0.0.0.0',
      port: 8080,
    },
    modules: {
      certificates: {
        endpointPrefix: 'certificates',
        host: '0.0.0.0',
        port: 8083,
      },
      configuration: {
        heartbeatInterval: 60,
        bootRetryInterval: 15,
        ocpp2_0_1: {
          unknownChargerStatus: OCPP2_0_1.RegistrationStatusEnumType.Accepted,
          getBaseReportOnPending: true,
          bootWithRejectedVariables: true,
          autoAccept: true,
        },
        ocpp1_6: {
          unknownChargerStatus: OCPP1_6.BootNotificationResponseStatus.Accepted,
        },
        endpointPrefix: 'configuration',
        host: '0.0.0.0',
        port: 8084,
      },
      evdriver: {
        endpointPrefix: 'evdriver',
        host: '0.0.0.0',
        port: 8085,
      },
      monitoring: {
        endpointPrefix: 'monitoring',
        host: '0.0.0.0',
        port: 8086,
      },
      reporting: {
        endpointPrefix: 'reporting',
        host: '0.0.0.0',
        port: 8087,
      },
      smartcharging: {
        endpointPrefix: 'smartcharging',
        host: '0.0.0.0',
        port: 8088,
      },
      tenant: {
        endpointPrefix: 'tenant',
        host: '0.0.0.0',
        port: 8090,
      },
      transactions: {
        endpointPrefix: 'transactions',
        host: '0.0.0.0',
        port: 8089,
        costUpdatedInterval: 60,
      },
    },
    data: {
      sequelize: {
        host: 'ocpp-db',
        port: 5432,
        database: 'citrine',
        dialect: 'postgres',
        username: 'citrine',
        password: 'citrine',
        storage: '',
        sync: false,
      },
    },
    util: {
      cache: {
        redis: {
          host: 'redis',
          port: 6379,
        },
      },
      messageBroker: {
        amqp: {
          url: 'amqp://guest:guest@amqp-broker:5672',
          exchange: 'citrineos',
        },
      },
      swagger: {
        path: '/docs',
        logoPath: '/usr/server/src/assets/logo.png',
        exposeData: true,
        exposeMessage: true,
      },
      fileAccess: {
        directus: {
          host: 'directus',
          port: 8055,
          generateFlows: true,
        },
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
            tenantId: DEFAULT_TENANT_ID,
          },
          {
            id: '1',
            securityProfile: 1,
            allowUnknownChargingStations: false,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8082,
            protocol: 'ocpp2.0.1',
            tenantId: DEFAULT_TENANT_ID,
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
            accountKeyFilePath:
              '/usr/local/apps/citrineos/Swarm/src/assets/certificates/acme_account_key.pem',
            email: 'test@citrineos.com',
          },
        },
      },
    },
    logLevel: 2, // debug
    maxCallLengthSeconds: 5,
    maxCachingSeconds: 10,
    ocpiServer: {
      host: '0.0.0.0',
      port: 8085,
    },
    userPreferences: {
      // None by default
    },
  });
}
