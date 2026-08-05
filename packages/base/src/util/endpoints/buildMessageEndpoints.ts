// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IEndpointBuilder } from '@interfaces/api/endpoints/buildEndpoints.js';
import type {
  BuiltMessageEndpoint,
  MessageEndpointClass,
} from '@interfaces/api/endpoints/buildMessageEndpoints.js';

export function buildMessageEndpoints(
  builder: IEndpointBuilder,
  endpointClasses: ReadonlyArray<MessageEndpointClass>,
): BuiltMessageEndpoint[] {
  return endpointClasses.map((endpointClass) => ({
    route: endpointClass.route,
    endpoint: builder.build(endpointClass),
  }));
}
