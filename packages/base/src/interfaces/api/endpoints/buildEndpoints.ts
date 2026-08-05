// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AbstractEndpoint } from '@interfaces/api/endpoints/AbstractEndpoint.js';
import type { IEndpointDefinition } from '@interfaces/api/endpoints/EndpointDefinition.js';

export type EndpointClass = (new (...args: never[]) => AbstractEndpoint) & {
  readonly route: IEndpointDefinition;
};

export interface BuiltEndpoint {
  route: IEndpointDefinition;
  endpoint: AbstractEndpoint;
}

export interface IEndpointBuilder {
  build<T>(target: new (...args: never[]) => T): T;
}

export interface EndpointResolverCradle {
  moduleScope: IEndpointBuilder;
}

export function buildEndpoints(
  builder: IEndpointBuilder,
  endpointClasses: ReadonlyArray<EndpointClass>,
): BuiltEndpoint[] {
  return endpointClasses.map((endpointClass) => ({
    route: endpointClass.route,
    endpoint: builder.build(endpointClass),
  }));
}
