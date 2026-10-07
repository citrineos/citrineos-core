// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ICommandEndpointMetadata } from '@interfaces/api/endpoints/endpoint-metadata.js';
import type { IMessageEndpointMetadata } from '@interfaces/api/endpoints/abstract-message-endpoint.js';

const segments = (value: string): string[] => value.split('/').filter(Boolean);

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

export function commandPermissionName(prefix: string, route: ICommandEndpointMetadata): string {
  if (route.permission) {
    return route.permission;
  }
  return [...segments(prefix), ...segments(route.path), route.method.toLowerCase()].join('.');
}

export function messagePermissionName(route: IMessageEndpointMetadata): string {
  if (route.permission) {
    return route.permission;
  }
  return ['ocpp', route.eventGroup, lowerFirst(String(route.action))].join('.');
}
