// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type BootstrapConfig } from '@citrineos/base';
import {
  HUBJECT_DEFAULT_BASEURL,
  HUBJECT_DEFAULT_CLIENTID,
  HUBJECT_DEFAULT_CLIENTSECRET,
  HUBJECT_DEFAULT_TOKENURL,
  OCPP_CallAction,
  type SystemConfig,
} from '@citrineos/types';

export function aSystemConfig(
  override?: Partial<BootstrapConfig & SystemConfig>,
): BootstrapConfig & SystemConfig {
  const config: BootstrapConfig & SystemConfig = {
    configFileName: 'config.json',
    database: {
      host: 'localhost',
      port: 5432,
      database: 'citrine',
      dialect: 'postgres',
      username: 'citrine',
      password: 'citrine',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 3,
      retryDelay: 1000,
    },
    fileAccess: {
      type: 'local',
      local: { defaultFilePath: 'data' },
    },
    env: 'development',
    centralSystem: { host: '::', port: 8080 },
    modules: {
      certificates: { endpointPrefix: '/certificates', requests: [], responses: [] },
      configuration: {
        endpointPrefix: '/configuration',
        heartbeatInterval: 60,
        bootRetryInterval: 15,
        ocpp2_0_1: {
          unknownChargerStatus: 'Accepted',
          getBaseReportOnPending: true,
          bootWithRejectedVariables: true,
          autoAccept: true,
        },
        requests: [],
        responses: [],
      },
      evdriver: { endpointPrefix: '/evdriver', requests: [], responses: [] },
      monitoring: { endpointPrefix: '/monitoring', requests: [], responses: [] },
      reporting: { endpointPrefix: '/reporting', requests: [], responses: [] },
      smartcharging: { endpointPrefix: '/smartcharging', requests: [], responses: [] },
      tenant: { endpointPrefix: '/tenant', requests: [], responses: [] },
      transactions: {
        endpointPrefix: '/transactions',
        costUpdatedInterval: 60,
        requests: [OCPP_CallAction.TransactionEvent],
        responses: [OCPP_CallAction.CostUpdated],
      },
    },
    util: {
      cache: { memory: true },
      messageBroker: {
        amqp: { url: 'amqp://guest:guest@localhost:5672', exchange: 'citrineos' },
      },
      authProvider: { localByPass: true },
      swagger: { path: '/docs', logoPath: '/tmp/logo.png', exposeMessage: false },
      certificateAuthority: {
        v2gCA: {
          name: 'hubject',
          hubject: {
            baseUrl: HUBJECT_DEFAULT_BASEURL,
            tokenUrl: HUBJECT_DEFAULT_TOKENURL,
            clientId: HUBJECT_DEFAULT_CLIENTID,
            clientSecret: HUBJECT_DEFAULT_CLIENTSECRET,
          },
        },
        chargingStationCA: {
          name: 'acme',
          acme: {
            env: 'staging',
            accountKeyFilePath: '/tmp/acme_account_key.pem',
            email: 'test@citrineos.com',
          },
        },
      },
      networkConnection: {
        websocketServers: [
          {
            id: '0',
            securityProfile: 0,
            allowUnknownChargingStations: true,
            dynamicTenantResolution: false,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8081,
            protocols: ['ocpp2.0.1'],
            tenantId: DEFAULT_TENANT_ID,
          },
        ],
      },
    },
    logLevel: 2,
    maxCallLengthSeconds: 30,
    maxCachingSeconds: 30,
    maxReconnectDelay: 30,
    shutdownGracePeriodSeconds: 30,
    realTimeAuthDefaultTimeoutSeconds: 15,
    notReadyThresholdSeconds: 60,
    ocpiServer: { host: '0.0.0.0', port: 8085 },
    userPreferences: {},
  };

  return { ...config, ...override };
}
