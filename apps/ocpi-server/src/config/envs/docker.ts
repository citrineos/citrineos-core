// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcpiConfigInput } from '@citrineos/ocpi-base';

export function createDockerOcpiConfig(): OcpiConfigInput {
  return {
    env: 'development',

    ocpiServer: {
      host: '0.0.0.0',
      port: 8085,
    },

    ocpiModules: {
      credentials: {
        endpointPrefix: '/credentials',
      },
      versions: {
        endpointPrefix: '/versions',
      },
      locations: {
        endpointPrefix: '/locations',
      },
      sessions: {
        endpointPrefix: '/sessions',
      },
      cdrs: {
        endpointPrefix: '/cdrs',
      },
      tokens: {
        endpointPrefix: '/tokens',
      },
      tariffs: {
        endpointPrefix: '/tariffs',
      },
      chargingProfiles: {
        endpointPrefix: '/chargingprofiles',
      },
      commands: {
        endpointPrefix: '/commands',
      },
    },

    database: {
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'citrine',
      username: process.env.DB_USER || 'citrine',
      password: process.env.DB_PASS || 'citrine',
    },

    cache: {
      ...(process.env.REDIS_HOST
        ? {
            redis: {
              host: process.env.REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
          }
        : { memory: true }),
    },

    graphql: {
      endpoint: process.env.GRAPHQL_ENDPOINT || 'http://graphql-engine:8080/v1/graphql',
    },

    commands: {
      timeout: parseInt(process.env.COMMANDS_TIMEOUT || '30'),
      ocpiBaseUrl: process.env.COMMANDS_OCPI_BASE_URL || 'http://citrineos-ocpi:8085/ocpi',
      coreHeaders: JSON.parse(process.env.COMMANDS_CORE_HEADERS || '{}'),
      ocpp1_6: {
        remoteStartTransactionRequestUrl:
          process.env.COMMANDS_OCPP1_6_REMOTE_START_TRANSACTION_REQUEST_URL ||
          'http://citrine:8080/ocpp/1.6/evdriver/remoteStartTransaction',
        remoteStopTransactionRequestUrl:
          process.env.COMMANDS_OCPP1_6_REMOTE_STOP_TRANSACTION_REQUEST_URL ||
          'http://citrine:8080/ocpp/1.6/evdriver/remoteStopTransaction',
        unlockConnectorRequestUrl:
          process.env.COMMANDS_OCPP1_6_UNLOCK_CONNECTOR_REQUEST_URL ||
          'http://citrine:8080/ocpp/1.6/evdriver/unlockConnector',
      },
      ocpp2_0_1: {
        requestStartTransactionRequestUrl:
          process.env.COMMANDS_OCPP2_0_1_REQUEST_START_TRANSACTION_REQUEST_URL ||
          'http://citrine:8080/ocpp/2.0.1/evdriver/requestStartTransaction',
        requestStopTransactionRequestUrl:
          process.env.COMMANDS_OCPP2_0_1_REQUEST_STOP_TRANSACTION_REQUEST_URL ||
          'http://citrine:8080/ocpp/2.0.1/evdriver/requestStopTransaction',
        unlockConnectorRequestUrl:
          process.env.COMMANDS_OCPP2_0_1_UNLOCK_CONNECTOR_REQUEST_URL ||
          'http://citrine:8080/ocpp/2.0.1/evdriver/unlockConnector',
      },
    },

    messageBroker: {
      amqp: {
        url: process.env.AMQP_URL || 'amqp://guest:guest@rabbitmq:5672',
        exchange: process.env.AMQP_EXCHANGE || 'ocpi',
      },
    },

    logLevel: parseInt(process.env.LOG_LEVEL || '2'),
    defaultPageLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT || '50'),
    maxPageLimit: parseInt(process.env.MAX_PAGE_LIMIT || '1000'),
  };
}
