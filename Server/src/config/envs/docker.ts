// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  DEFAULT_TENANT_ID,
  defineConfig,
  OCPP1_6,
  OCPP2_0_1,
  OCPP_CallAction,
} from '@citrineos/base';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

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
        responses: [
          OCPP_CallAction.CertificateSigned,
          OCPP_CallAction.DeleteCertificate,
          OCPP_CallAction.GetInstalledCertificateIds,
          OCPP_CallAction.InstallCertificate,
        ],
        requests: [
          OCPP_CallAction.Get15118EVCertificate,
          OCPP_CallAction.GetCertificateStatus,
          OCPP_CallAction.SignCertificate,
        ],
      },
      configuration: {
        responses: [
          OCPP_CallAction.ChangeAvailability,
          OCPP_CallAction.ClearDisplayMessage,
          OCPP_CallAction.GetDisplayMessages,
          OCPP_CallAction.PublishFirmware,
          OCPP_CallAction.Reset,
          OCPP_CallAction.SetDisplayMessage,
          OCPP_CallAction.SetNetworkProfile,
          OCPP_CallAction.TriggerMessage,
          OCPP_CallAction.UnpublishFirmware,
          OCPP_CallAction.UpdateFirmware,
          OCPP_CallAction.ChangeConfiguration,
          OCPP_CallAction.GetConfiguration,
        ],
        requests: [
          OCPP_CallAction.BootNotification,
          OCPP_CallAction.DataTransfer,
          OCPP_CallAction.FirmwareStatusNotification,
          OCPP_CallAction.Heartbeat,
          OCPP_CallAction.NotifyDisplayMessages,
          OCPP_CallAction.PublishFirmwareStatusNotification,
        ],
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
        endpointPrefix: '/configuration',
      },
      evdriver: {
        endpointPrefix: '/evdriver',
        responses: [
          OCPP_CallAction.CancelReservation,
          OCPP_CallAction.ClearCache,
          OCPP_CallAction.GetLocalListVersion,
          OCPP_CallAction.RequestStartTransaction,
          OCPP_CallAction.RequestStopTransaction,
          OCPP_CallAction.ReserveNow,
          OCPP_CallAction.SendLocalList,
          OCPP_CallAction.UnlockConnector,
          OCPP_CallAction.RemoteStopTransaction,
          OCPP_CallAction.RemoteStartTransaction,
        ],
        requests: [OCPP_CallAction.Authorize, OCPP_CallAction.ReservationStatusUpdate],
      },
      monitoring: {
        endpointPrefix: '/monitoring',
        responses: [
          OCPP_CallAction.ClearVariableMonitoring,
          OCPP_CallAction.GetVariables,
          OCPP_CallAction.SetMonitoringBase,
          OCPP_CallAction.SetMonitoringLevel,
          OCPP_CallAction.GetMonitoringReport,
          OCPP_CallAction.SetVariableMonitoring,
          OCPP_CallAction.SetVariables,
        ],
        requests: [OCPP_CallAction.NotifyEvent],
      },
      reporting: {
        endpointPrefix: '/reporting',
        responses: [
          OCPP_CallAction.CustomerInformation,
          OCPP_CallAction.GetLog,
          OCPP_CallAction.GetReport,
          OCPP_CallAction.GetBaseReport,
          OCPP_CallAction.GetMonitoringReport,
        ],
        requests: [
          OCPP_CallAction.LogStatusNotification,
          OCPP_CallAction.NotifyCustomerInformation,
          OCPP_CallAction.NotifyReport,
          OCPP_CallAction.SecurityEventNotification,
          OCPP_CallAction.NotifyMonitoringReport,
        ],
      },
      smartcharging: {
        endpointPrefix: '/smartcharging',
        responses: [
          OCPP_CallAction.ClearChargingProfile,
          OCPP_CallAction.GetChargingProfiles,
          OCPP_CallAction.GetCompositeSchedule,
          OCPP_CallAction.SetChargingProfile,
        ],
        requests: [
          OCPP_CallAction.ClearedChargingLimit,
          OCPP_CallAction.NotifyChargingLimit,
          OCPP_CallAction.NotifyEVChargingNeeds,
          OCPP_CallAction.NotifyEVChargingSchedule,
          OCPP_CallAction.ReportChargingProfiles,
        ],
      },
      tenant: {
        endpointPrefix: '/tenant',
        responses: [],
        requests: [],
      },
      transactions: {
        endpointPrefix: '/transactions',
        costUpdatedInterval: 60,
        responses: [OCPP_CallAction.CostUpdated, OCPP_CallAction.GetTransactionStatus],
        requests: [
          OCPP_CallAction.MeterValues,
          OCPP_CallAction.StatusNotification,
          OCPP_CallAction.TransactionEvent,
          OCPP_CallAction.StatusNotification,
          OCPP_CallAction.StartTransaction,
          OCPP_CallAction.StopTransaction,
        ],
      },
    },
    util: {
      cache: {
        memory: true,
      },
      messageBroker: {
        amqp: {
          url: 'amqp://guest:guest@amqp-broker:5672',
          exchange: 'citrineos',
        },
      },
      authProvider: {
        localByPass: true,
      },
      swagger: {
        path: '/docs',
        logoPath: path.resolve(path.dirname(__filename), '../../assets/logo.png'),
        exposeData: true,
        exposeMessage: true,
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
            tenantId: DEFAULT_TENANT_ID,
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
            tenantId: DEFAULT_TENANT_ID,
          },
          {
            id: '4',
            securityProfile: 0,
            allowUnknownChargingStations: true,
            pingInterval: 60,
            host: '0.0.0.0',
            port: 8092,
            protocol: 'ocpp1.6',
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
    userPreferences: {
      // None by default
    },
  });
}
