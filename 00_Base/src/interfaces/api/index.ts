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

export { AbstractModuleApi } from './AbstractModuleApi';
export { AsDataEndpoint } from './AsDataEndpoint';
export { AsMessageEndpoint } from './AsMessageEndpoint';
export { IDataEndpointDefinition } from './DataEndpointDefinition';
export { IMessageEndpointDefinition } from './MessageEndpointDefinition';
export { IMessageQuerystring } from './MessageQuerystring';
export { IModuleApi } from './ModuleApi';
export {
  IApiAuthProvider,
  ApiAuthorizationResult,
  ApiAuthenticationResult,
  UserInfo,
} from './auth';
