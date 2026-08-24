// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AbstractEndpoint } from '@interfaces/api/endpoints/AbstractEndpoint.js';
import type { ICommandEndpointMetadata } from '@interfaces/api/endpoints/EndpointMetadata.js';

export type EndpointClass = (new (...args: never[]) => AbstractEndpoint) & {
  readonly route: ICommandEndpointMetadata;
};

export interface BuiltEndpoint {
  route: ICommandEndpointMetadata;
  endpoint: AbstractEndpoint;
}

export interface IEndpointBuilder {
  build<T>(target: new (...args: never[]) => T): T;
}

export interface EndpointResolverCradle {
  moduleScope: IEndpointBuilder;
}
