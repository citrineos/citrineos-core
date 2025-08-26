// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

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
export { IDataEndpointDefinition } from './DataEndpointDefinition.js';
export { IMessageEndpointDefinition } from './MessageEndpointDefinition.js';
export { IMessageQuerystring } from './MessageQuerystring.js';
export { IModuleApi } from './ModuleApi.js';
export {
  IApiAuthProvider,
  ApiAuthorizationResult,
  ApiAuthenticationResult,
  UserInfo,
} from './auth/index.js';
