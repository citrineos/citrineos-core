// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asFunction, type AwilixContainer } from 'awilix';
import {
  type BuiltEndpoint,
  type BuiltMessageEndpoint,
  buildEndpoints,
  buildMessageEndpoints,
  type EndpointClass,
  type EndpointResolverCradle,
  type MessageEndpointClass,
} from '@citrineos/base';
import { DeleteStationNetworkProfileEndpoint } from './commands/DeleteStationNetworkProfileEndpoint.js';
import {
  DeleteBootConfigEndpoint,
  GetBootConfigEndpoint,
  PutBootConfigEndpoint,
} from './commands/BootConfigEndpoints.js';
import { GetLocalListVersionEndpoint } from './commands/GetLocalListVersionEndpoint.js';
import { GetStationNetworkProfilesEndpoint } from './commands/GetStationNetworkProfilesEndpoint.js';
import { GetTransactionEndpoint } from './commands/GetTransactionEndpoint.js';
import {
  DeleteStationVariablesEndpoint,
  GetStationVariablesEndpoint,
} from './commands/StationVariableEndpoints.js';
import {
  DeleteTariffsEndpoint,
  GetTariffsEndpoint,
  UpsertTariffEndpoint,
} from './commands/TariffEndpoints.js';
import { InstallRootCertificateEndpoint } from './commands/InstallRootCertificateEndpoint.js';
import { ProvisionStationVariablesEndpoint } from './commands/ProvisionStationVariablesEndpoint.js';
import { RegenerateCertificateEndpoint } from './commands/RegenerateCertificateEndpoint.js';
import { SetStationPasswordEndpoint } from './commands/SetStationPasswordEndpoint.js';
import { UploadExistingCertificateEndpoint } from './commands/UploadExistingCertificateEndpoint.js';
import { InitiateWebPaymentEndpoint } from './webPayment/InitiateWebPaymentEndpoint.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS as CONFIGURATION_OCPP16_ENDPOINTS } from './ocpp/1.6/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS as EV_DRIVER_OCPP16_ENDPOINTS } from './ocpp/1.6/evDriver.js';
import { REPORTING_MESSAGE_ENDPOINTS as REPORTING_OCPP16_ENDPOINTS } from './ocpp/1.6/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS as SMART_CHARGING_OCPP16_ENDPOINTS } from './ocpp/1.6/smartCharging.js';
import { CERTIFICATES_MESSAGE_ENDPOINTS as CERTIFICATES_OCPP2_ENDPOINTS } from './ocpp/2/certificates.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS as CONFIGURATION_OCPP2_ENDPOINTS } from './ocpp/2/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS as EV_DRIVER_OCPP2_ENDPOINTS } from './ocpp/2/evDriver.js';
import { MONITORING_MESSAGE_ENDPOINTS as MONITORING_OCPP2_ENDPOINTS } from './ocpp/2/monitoring.js';
import { REPORTING_MESSAGE_ENDPOINTS as REPORTING_OCPP2_ENDPOINTS } from './ocpp/2/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS as SMART_CHARGING_OCPP2_ENDPOINTS } from './ocpp/2/smartCharging.js';
import { TRANSACTIONS_MESSAGE_ENDPOINTS as TRANSACTIONS_OCPP2_ENDPOINTS } from './ocpp/2/transactions.js';
import { CreateSubscriptionEndpoint } from './router/CreateSubscriptionEndpoint.js';
import { CreateWebsocketConfigurationEndpoint } from './router/CreateWebsocketConfigurationEndpoint.js';
import { DeleteSubscriptionEndpoint } from './router/DeleteSubscriptionEndpoint.js';
import { DeleteWebsocketConfigurationEndpoint } from './router/DeleteWebsocketConfigurationEndpoint.js';
import { DeleteWebsocketConnectionEndpoint } from './router/DeleteWebsocketConnectionEndpoint.js';
import { DeleteWebsocketMappingEndpoint } from './router/DeleteWebsocketMappingEndpoint.js';
import { GenerateCertificateChainEndpoint } from './router/GenerateCertificateChainEndpoint.js';
import { GetSubscriptionsEndpoint } from './router/GetSubscriptionsEndpoint.js';
import { GetSystemConfigEndpoint } from './router/GetSystemConfigEndpoint.js';
import { GetWebsocketConfigurationsEndpoint } from './router/GetWebsocketConfigurationsEndpoint.js';
import { PutSystemConfigEndpoint } from './router/PutSystemConfigEndpoint.js';
import { PutWebsocketMappingEndpoint } from './router/PutWebsocketMappingEndpoint.js';
import { ReloadTlsCertificatesEndpoint } from './router/ReloadTlsCertificatesEndpoint.js';

const COMMAND_ENDPOINTS = [
  DeleteBootConfigEndpoint,
  DeleteStationNetworkProfileEndpoint,
  DeleteStationVariablesEndpoint,
  DeleteTariffsEndpoint,
  GetBootConfigEndpoint,
  GetLocalListVersionEndpoint,
  GetStationNetworkProfilesEndpoint,
  GetStationVariablesEndpoint,
  GetTariffsEndpoint,
  GetTransactionEndpoint,
  InstallRootCertificateEndpoint,
  ProvisionStationVariablesEndpoint,
  PutBootConfigEndpoint,
  RegenerateCertificateEndpoint,
  SetStationPasswordEndpoint,
  UpsertTariffEndpoint,
  UploadExistingCertificateEndpoint,
] satisfies ReadonlyArray<EndpointClass>;

const WEB_PAYMENT_ENDPOINTS = [InitiateWebPaymentEndpoint] satisfies ReadonlyArray<EndpointClass>;

const MESSAGE_ENDPOINTS = [
  ...CONFIGURATION_OCPP16_ENDPOINTS,
  ...EV_DRIVER_OCPP16_ENDPOINTS,
  ...REPORTING_OCPP16_ENDPOINTS,
  ...SMART_CHARGING_OCPP16_ENDPOINTS,
  ...CERTIFICATES_OCPP2_ENDPOINTS,
  ...CONFIGURATION_OCPP2_ENDPOINTS,
  ...EV_DRIVER_OCPP2_ENDPOINTS,
  ...MONITORING_OCPP2_ENDPOINTS,
  ...REPORTING_OCPP2_ENDPOINTS,
  ...SMART_CHARGING_OCPP2_ENDPOINTS,
  ...TRANSACTIONS_OCPP2_ENDPOINTS,
] satisfies ReadonlyArray<MessageEndpointClass>;

const ADMIN_ENDPOINTS = [
  CreateSubscriptionEndpoint,
  CreateWebsocketConfigurationEndpoint,
  DeleteSubscriptionEndpoint,
  DeleteWebsocketConfigurationEndpoint,
  DeleteWebsocketConnectionEndpoint,
  DeleteWebsocketMappingEndpoint,
  GenerateCertificateChainEndpoint,
  GetSubscriptionsEndpoint,
  GetSystemConfigEndpoint,
  GetWebsocketConfigurationsEndpoint,
  PutSystemConfigEndpoint,
  PutWebsocketMappingEndpoint,
  ReloadTlsCertificatesEndpoint,
] satisfies ReadonlyArray<EndpointClass>;

export function registerApiServices(container: AwilixContainer): void {
  container.register({
    commandEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, COMMAND_ENDPOINTS),
    ).scoped(),
    webPaymentEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, WEB_PAYMENT_ENDPOINTS),
    ).scoped(),
    adminEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, ADMIN_ENDPOINTS),
    ).scoped(),
    messageEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltMessageEndpoint[] =>
      buildMessageEndpoints(cradle.moduleScope, MESSAGE_ENDPOINTS),
    ).scoped(),
  });
}
