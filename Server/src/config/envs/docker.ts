// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineConfig, RegistrationStatusEnumType } from '@citrineos/base';
import path from 'path';
import 'dotenv/config';

export function createDockerConfig() {
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
        host: 'ocpp-db',
        port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : undefined,
        database: process.env.POSTGRES_DB,
        dialect: 'postgres',
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
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
          url: `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
          exchange: 'citrineos',
        },
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
        host: 'directus',
        port: 8055,
        generateFlows: false,
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
          {
            id: '2',
            securityProfile: 2,
            allowUnknownChargingStations: false,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8443,
            protocol: 'ocpp2.0.1',
            tlsKeyFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/leafKey.pem',
            ),
            tlsCertificateChainFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/certChain.pem',
            ),
            rootCACertificateFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/rootCertificate.pem',
            ),
          },
          {
            id: '3',
            securityProfile: 3,
            allowUnknownChargingStations: false,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8444,
            protocol: 'ocpp2.0.1',
            tlsKeyFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/leafKey.pem',
            ),
            tlsCertificateChainFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/certChain.pem',
            ),
            mtlsCertificateAuthorityKeyFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/subCAKey.pem',
            ),
            rootCACertificateFilePath: path.resolve(
              path.dirname(__filename),
              '../../assets/certificates/rootCertificate.pem',
            ),
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
    maxCallLengthSeconds: 5,
    maxCachingSeconds: 10,
    ocpiServer: {
      host: '0.0.0.0',
      port: 8085,
    },
  });
}
