// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BuiltEndpoint,
  EndpointClass,
  IEndpointBuilder,
} from '@interfaces/api/endpoints/buildEndpoints.js';

export function buildEndpoints(
  builder: IEndpointBuilder,
  endpointClasses: ReadonlyArray<EndpointClass>,
): BuiltEndpoint[] {
  return endpointClasses.map((endpointClass) => ({
    route: endpointClass.route,
    endpoint: builder.build(endpointClass),
  }));
}
