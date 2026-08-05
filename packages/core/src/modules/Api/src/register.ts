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
import { InstallRootCertificateEndpoint } from './module/endpoints/InstallRootCertificateEndpoint.js';
import { RegenerateCertificateEndpoint } from './module/endpoints/RegenerateCertificateEndpoint.js';
import { SetStationPasswordEndpoint } from './module/endpoints/SetStationPasswordEndpoint.js';
import { UploadExistingCertificateEndpoint } from './module/endpoints/UploadExistingCertificateEndpoint.js';
import { InitiateWebPaymentEndpoint } from './module/endpoints/webPayment/InitiateWebPaymentEndpoint.js';
import { CERTIFICATES_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/certificates.js';
import { CONFIGURATION_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/configuration.js';
import { EV_DRIVER_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/evDriver.js';
import { MONITORING_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/monitoring.js';
import { REPORTING_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/reporting.js';
import { SMART_CHARGING_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/smartCharging.js';
import { TRANSACTIONS_MESSAGE_ENDPOINTS } from './module/endpoints/ocpp/transactions.js';

const COMMAND_ENDPOINTS = [
  DeleteStationNetworkProfileEndpoint,
  InstallRootCertificateEndpoint,
  RegenerateCertificateEndpoint,
  SetStationPasswordEndpoint,
  UploadExistingCertificateEndpoint,
] satisfies ReadonlyArray<EndpointClass>;

const WEB_PAYMENT_ENDPOINTS = [InitiateWebPaymentEndpoint] satisfies ReadonlyArray<EndpointClass>;

const MESSAGE_ENDPOINTS = [
  ...CERTIFICATES_MESSAGE_ENDPOINTS,
  ...CONFIGURATION_MESSAGE_ENDPOINTS,
  ...EV_DRIVER_MESSAGE_ENDPOINTS,
  ...MONITORING_MESSAGE_ENDPOINTS,
  ...REPORTING_MESSAGE_ENDPOINTS,
  ...SMART_CHARGING_MESSAGE_ENDPOINTS,
  ...TRANSACTIONS_MESSAGE_ENDPOINTS,
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
