// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asFunction, type AwilixContainer } from 'awilix';
import {
  type BuiltEndpoint,
  buildEndpoints,
  type EndpointClass,
  type EndpointResolverCradle,
} from '@citrineos/base';
import { CreateSubscriptionEndpoint } from './module/endpoints/CreateSubscriptionEndpoint.js';
import { CreateWebsocketConfigurationEndpoint } from './module/endpoints/CreateWebsocketConfigurationEndpoint.js';
import { DeleteSubscriptionEndpoint } from './module/endpoints/DeleteSubscriptionEndpoint.js';
import { DeleteWebsocketConfigurationEndpoint } from './module/endpoints/DeleteWebsocketConfigurationEndpoint.js';
import { DeleteWebsocketConnectionEndpoint } from './module/endpoints/DeleteWebsocketConnectionEndpoint.js';
import { DeleteWebsocketMappingEndpoint } from './module/endpoints/DeleteWebsocketMappingEndpoint.js';
import { GenerateCertificateChainEndpoint } from './module/endpoints/GenerateCertificateChainEndpoint.js';
import { GetSubscriptionsEndpoint } from './module/endpoints/GetSubscriptionsEndpoint.js';
import { GetSystemConfigEndpoint } from './module/endpoints/GetSystemConfigEndpoint.js';
import { GetWebsocketConfigurationsEndpoint } from './module/endpoints/GetWebsocketConfigurationsEndpoint.js';
import { PutSystemConfigEndpoint } from './module/endpoints/PutSystemConfigEndpoint.js';
import { PutWebsocketMappingEndpoint } from './module/endpoints/PutWebsocketMappingEndpoint.js';
import { ReloadTlsCertificatesEndpoint } from './module/endpoints/ReloadTlsCertificatesEndpoint.js';

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

export function registerOcppRouterServices(container: AwilixContainer): void {
  container.register({
    adminEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, ADMIN_ENDPOINTS),
    ).scoped(),
  });
}
