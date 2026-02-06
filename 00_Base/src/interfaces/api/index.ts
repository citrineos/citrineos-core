// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum HttpMethod {
  Get = 'GET',
  Put = 'PUT',
  Post = 'POST',
  Patch = 'PATCH',
  Delete = 'DELETE',
}

export const METADATA_MESSAGE_ENDPOINTS = 'METADATA_MESSAGE_ENDPOINTS';
export const METADATA_DATA_ENDPOINTS = 'METADATA_DATA_ENDPOINTS';

export { AbstractModuleApi } from './AbstractModuleApi.js';
export { AsDataEndpoint } from './AsDataEndpoint.js';
export { AsMessageEndpoint } from './AsMessageEndpoint.js';
export type { IDataEndpointDefinition } from './DataEndpointDefinition.js';
export type { IMessageEndpointDefinition } from './MessageEndpointDefinition.js';
export type { IMessageQuerystring } from './MessageQuerystring.js';
export type { IModuleApi } from './ModuleApi.js';
export type { IApiAuthProvider, UserInfo } from './auth/index.js';
export { ApiAuthorizationResult, ApiAuthenticationResult } from './auth/index.js';
