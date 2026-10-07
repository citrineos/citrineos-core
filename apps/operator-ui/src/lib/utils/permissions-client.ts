// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseRestClient } from './base-rest-client';

export const PERMISSIONS_API_PATH = '/permissions';
export const PERMISSIONS_CACHE_MS = 60 * 1000;
export const PERMISSIONS_QUERY_KEY = ['permissions', 'user'] as const;

export interface UserPermissions {
  roles: string[];
  resources: Record<string, string[]>;
  permissions: string[];
  enforcing: boolean;
}

const permissionsClient = new BaseRestClient(PERMISSIONS_API_PATH);

export const fetchUserPermissions = (): Promise<UserPermissions> =>
  permissionsClient.get<UserPermissions>('/user', {});
