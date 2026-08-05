// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AbstractMessageEndpoint,
  IMessageEndpointDeclaration,
} from '@interfaces/api/endpoints/AbstractMessageEndpoint.js';

export type MessageEndpointClass = (new (...args: never[]) => AbstractMessageEndpoint) & {
  readonly route: IMessageEndpointDeclaration;
};

export interface BuiltMessageEndpoint {
  route: IMessageEndpointDeclaration;
  endpoint: AbstractMessageEndpoint;
}
