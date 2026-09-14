// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AbstractMessageEndpoint,
  IMessageEndpointMetadata,
} from '@interfaces/api/endpoints/abstract-message-endpoint.js';

export type MessageEndpointClass = (new (...args: never[]) => AbstractMessageEndpoint) & {
  readonly route: IMessageEndpointMetadata;
};

export interface BuiltMessageEndpoint {
  route: IMessageEndpointMetadata;
  endpoint: AbstractMessageEndpoint;
}
