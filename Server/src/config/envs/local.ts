// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  defineConfig,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
} from '@citrineos/base';
import path from 'path';

export function createLocalConfig() {
  return defineConfig({
    env: 'development',
    centralSystem: {
      host: '::',
      port: 8080,
    },
    modules: {
      certificates: {
        endpointPrefix: '/certificates',
        responses: [
          OCPP2_0_1_CallAction.CertificateSigned,
          OCPP2_0_1_CallAction.DeleteCertificate,
          OCPP2_0_1_CallAction.GetInstalledCertificateIds,
          OCPP2_0_1_CallAction.InstallCertificate,
        ],
        requests: [
          OCPP2_0_1_CallAction.Get15118EVCertificate,
          OCPP2_0_1_CallAction.GetCertificateStatus,
          OCPP2_0_1_CallAction.SignCertificate,
        ],
      },
      configuration: {
        responses: [
          OCPP2_0_1_CallAction.ChangeAvailability,
          OCPP2_0_1_CallAction.ClearDisplayMessage,
          OCPP2_0_1_CallAction.GetDisplayMessages,
          OCPP2_0_1_CallAction.PublishFirmware,
          OCPP2_0_1_CallAction.Reset,
          OCPP2_0_1_CallAction.SetDisplayMessage,
          OCPP2_0_1_CallAction.SetNetworkProfile,
          OCPP2_0_1_CallAction.TriggerMessage,
          OCPP2_0_1_CallAction.UnpublishFirmware,
          OCPP2_0_1_CallAction.UpdateFirmware,
          OCPP1_6_CallAction.ChangeAvailability,
          OCPP1_6_CallAction.ChangeConfiguration,
          OCPP1_6_CallAction.GetConfiguration,
          OCPP1_6_CallAction.Reset,
          OCPP1_6_CallAction.TriggerMessage,
        ],
        requests: [
          OCPP2_0_1_CallAction.BootNotification,
          OCPP2_0_1_CallAction.DataTransfer,
          OCPP2_0_1_CallAction.FirmwareStatusNotification,
          OCPP2_0_1_CallAction.Heartbeat,
          OCPP2_0_1_CallAction.NotifyDisplayMessages,
          OCPP2_0_1_CallAction.PublishFirmwareStatusNotification,
          OCPP1_6_CallAction.Heartbeat,
          OCPP1_6_CallAction.BootNotification,
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
          OCPP2_0_1_CallAction.CancelReservation,
          OCPP2_0_1_CallAction.ClearCache,
          OCPP2_0_1_CallAction.GetLocalListVersion,
          OCPP2_0_1_CallAction.RequestStartTransaction,
          OCPP2_0_1_CallAction.RequestStopTransaction,
          OCPP2_0_1_CallAction.ReserveNow,
          OCPP2_0_1_CallAction.SendLocalList,
          OCPP2_0_1_CallAction.UnlockConnector,
          OCPP1_6_CallAction.RemoteStopTransaction,
          OCPP1_6_CallAction.RemoteStartTransaction,
        ],
        requests: [OCPP2_0_1_CallAction.Authorize, OCPP2_0_1_CallAction.ReservationStatusUpdate],
      },
      monitoring: {
        endpointPrefix: '/monitoring',
        responses: [
          OCPP2_0_1_CallAction.ClearVariableMonitoring,
          OCPP2_0_1_CallAction.GetVariables,
          OCPP2_0_1_CallAction.SetMonitoringBase,
          OCPP2_0_1_CallAction.SetMonitoringLevel,
          OCPP2_0_1_CallAction.GetMonitoringReport,
          OCPP2_0_1_CallAction.SetVariableMonitoring,
          OCPP2_0_1_CallAction.SetVariables,
        ],
        requests: [OCPP2_0_1_CallAction.NotifyEvent],
      },
      reporting: {
        endpointPrefix: '/reporting',
        responses: [
          OCPP2_0_1_CallAction.CustomerInformation,
          OCPP2_0_1_CallAction.GetLog,
          OCPP2_0_1_CallAction.GetReport,
          OCPP2_0_1_CallAction.GetBaseReport,
          OCPP2_0_1_CallAction.GetMonitoringReport,
        ],
        requests: [
          OCPP2_0_1_CallAction.LogStatusNotification,
          OCPP2_0_1_CallAction.NotifyCustomerInformation,
          OCPP2_0_1_CallAction.NotifyReport,
          OCPP2_0_1_CallAction.SecurityEventNotification,
          OCPP2_0_1_CallAction.NotifyMonitoringReport,
        ],
      },
      smartcharging: {
        endpointPrefix: '/smartcharging',
        responses: [
          OCPP2_0_1_CallAction.ClearChargingProfile,
          OCPP2_0_1_CallAction.ClearedChargingLimit,
          OCPP2_0_1_CallAction.GetChargingProfiles,
          OCPP2_0_1_CallAction.GetCompositeSchedule,
          OCPP2_0_1_CallAction.SetChargingProfile,
        ],
        requests: [
          OCPP2_0_1_CallAction.NotifyChargingLimit,
          OCPP2_0_1_CallAction.NotifyEVChargingNeeds,
          OCPP2_0_1_CallAction.NotifyEVChargingSchedule,
          OCPP2_0_1_CallAction.ReportChargingProfiles,
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
        responses: [OCPP2_0_1_CallAction.CostUpdated, OCPP2_0_1_CallAction.GetTransactionStatus],
        requests: [
          OCPP2_0_1_CallAction.MeterValues,
          OCPP2_0_1_CallAction.StatusNotification,
          OCPP2_0_1_CallAction.TransactionEvent,
          OCPP1_6_CallAction.MeterValues,
          OCPP1_6_CallAction.StatusNotification,
          OCPP1_6_CallAction.StartTransaction,
          OCPP1_6_CallAction.StopTransaction,
        ],
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
    maxCallLengthSeconds: 30,
    maxCachingSeconds: 30,
    ocpiServer: {
      host: '0.0.0.0',
      port: 8085,
    },
    userPreferences: {
      // None by default
    },
  });
}
