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
import { DeleteStationNetworkProfileEndpoint } from './commands/delete-station-network-profile-endpoint.js';
import {
  DeleteBootConfigEndpoint,
  GetBootConfigEndpoint,
  PutBootConfigEndpoint,
} from './commands/boot-config-endpoints.js';
import { GetLocalListVersionEndpoint } from './commands/get-local-list-version-endpoint.js';
import { GetStationNetworkProfilesEndpoint } from './commands/get-station-network-profiles-endpoint.js';
import { GetTransactionEndpoint } from './commands/get-transaction-endpoint.js';
import {
  DeleteStationVariablesEndpoint,
  GetStationVariablesEndpoint,
} from './commands/station-variable-endpoints.js';
import {
  DeleteTariffsEndpoint,
  GetTariffsEndpoint,
  UpsertTariffEndpoint,
} from './commands/tariff-endpoints.js';
import { InstallRootCertificateEndpoint } from './commands/install-root-certificate-endpoint.js';
import { ProvisionStationVariablesEndpoint } from './commands/provision-station-variables-endpoint.js';
import { RegenerateCertificateEndpoint } from './commands/regenerate-certificate-endpoint.js';
import { SetStationPasswordEndpoint } from './commands/set-station-password-endpoint.js';
import { UploadExistingCertificateEndpoint } from './commands/upload-existing-certificate-endpoint.js';
import { InitiateWebPaymentEndpoint } from './web-payment/initiate-web-payment-endpoint.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS as CONFIGURATION_OCPP16_ENDPOINTS } from './ocpp/1.6/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS as EV_DRIVER_OCPP16_ENDPOINTS } from './ocpp/1.6/ev-driver.js';
import { REPORTING_MESSAGE_ENDPOINTS as REPORTING_OCPP16_ENDPOINTS } from './ocpp/1.6/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS as SMART_CHARGING_OCPP16_ENDPOINTS } from './ocpp/1.6/smart-charging.js';
import { CERTIFICATES_MESSAGE_ENDPOINTS as CERTIFICATES_OCPP2_ENDPOINTS } from './ocpp/2/certificates.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS as CONFIGURATION_OCPP2_ENDPOINTS } from './ocpp/2/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS as EV_DRIVER_OCPP2_ENDPOINTS } from './ocpp/2/ev-driver.js';
import { MONITORING_MESSAGE_ENDPOINTS as MONITORING_OCPP2_ENDPOINTS } from './ocpp/2/monitoring.js';
import { REPORTING_MESSAGE_ENDPOINTS as REPORTING_OCPP2_ENDPOINTS } from './ocpp/2/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS as SMART_CHARGING_OCPP2_ENDPOINTS } from './ocpp/2/smart-charging.js';
import { TRANSACTIONS_MESSAGE_ENDPOINTS as TRANSACTIONS_OCPP2_ENDPOINTS } from './ocpp/2/transactions.js';
import { CreateSubscriptionEndpoint } from './router/create-subscription-endpoint.js';
import { DeleteSubscriptionEndpoint } from './router/delete-subscription-endpoint.js';
import { DeleteWebsocketConnectionEndpoint } from './router/delete-websocket-connection-endpoint.js';
import { DeleteWebsocketMappingEndpoint } from './router/delete-websocket-mapping-endpoint.js';
import { GenerateCertificateChainEndpoint } from './router/generate-certificate-chain-endpoint.js';
import { GetSubscriptionsEndpoint } from './router/get-subscriptions-endpoint.js';
import { PutWebsocketMappingEndpoint } from './router/put-websocket-mapping-endpoint.js';
import { ReloadTlsCertificatesEndpoint } from './router/reload-tls-certificates-endpoint.js';

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
  DeleteSubscriptionEndpoint,
  DeleteWebsocketConnectionEndpoint,
  DeleteWebsocketMappingEndpoint,
  GenerateCertificateChainEndpoint,
  GetSubscriptionsEndpoint,
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
