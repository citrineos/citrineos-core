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
import { DeleteStationNetworkProfileEndpoint } from './module/endpoints/DeleteStationNetworkProfileEndpoint.js';
import {
  DeleteBootConfigEndpoint,
  GetBootConfigEndpoint,
  PutBootConfigEndpoint,
} from './module/endpoints/BootConfigEndpoints.js';
import { GetLocalListVersionEndpoint } from './module/endpoints/GetLocalListVersionEndpoint.js';
import { GetStationNetworkProfilesEndpoint } from './module/endpoints/GetStationNetworkProfilesEndpoint.js';
import { GetTransactionEndpoint } from './module/endpoints/GetTransactionEndpoint.js';
import {
  DeleteStationVariablesEndpoint,
  GetStationVariablesEndpoint,
} from './module/endpoints/StationVariableEndpoints.js';
import {
  DeleteTariffsEndpoint,
  GetTariffsEndpoint,
  UpsertTariffEndpoint,
} from './module/endpoints/TariffEndpoints.js';
import { InstallRootCertificateEndpoint } from './module/endpoints/InstallRootCertificateEndpoint.js';
import { ProvisionStationVariablesEndpoint } from './module/endpoints/ProvisionStationVariablesEndpoint.js';
import { RegenerateCertificateEndpoint } from './module/endpoints/RegenerateCertificateEndpoint.js';
import { SetStationPasswordEndpoint } from './module/endpoints/SetStationPasswordEndpoint.js';
import { UploadExistingCertificateEndpoint } from './module/endpoints/UploadExistingCertificateEndpoint.js';
import { InitiateWebPaymentEndpoint } from './module/endpoints/webPayment/InitiateWebPaymentEndpoint.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS as CONFIGURATION_OCPP16_ENDPOINTS } from './module/endpoints/ocpp/1.6/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS as EV_DRIVER_OCPP16_ENDPOINTS } from './module/endpoints/ocpp/1.6/evDriver.js';
import { REPORTING_MESSAGE_ENDPOINTS as REPORTING_OCPP16_ENDPOINTS } from './module/endpoints/ocpp/1.6/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS as SMART_CHARGING_OCPP16_ENDPOINTS } from './module/endpoints/ocpp/1.6/smartCharging.js';
import { CERTIFICATES_MESSAGE_ENDPOINTS as CERTIFICATES_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/certificates.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS as CONFIGURATION_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS as EV_DRIVER_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/evDriver.js';
import { MONITORING_MESSAGE_ENDPOINTS as MONITORING_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/monitoring.js';
import { REPORTING_MESSAGE_ENDPOINTS as REPORTING_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS as SMART_CHARGING_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/smartCharging.js';
import { TRANSACTIONS_MESSAGE_ENDPOINTS as TRANSACTIONS_OCPP2_ENDPOINTS } from './module/endpoints/ocpp/2/transactions.js';

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

export function registerApiServices(container: AwilixContainer): void {
  container.register({
    commandEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, COMMAND_ENDPOINTS),
    ).scoped(),
    webPaymentEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, WEB_PAYMENT_ENDPOINTS),
    ).scoped(),
    messageEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltMessageEndpoint[] =>
      buildMessageEndpoints(cradle.moduleScope, MESSAGE_ENDPOINTS),
    ).scoped(),
  });
}
