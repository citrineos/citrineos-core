// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcppRequest, OcppResponse } from '../internal-types.js';

export interface SecurityEventNotificationRequest extends OcppRequest {
  type: string;
  timestamp: string;
  techInfo?: string | null;
}

export interface SecurityEventNotificationResponse extends OcppResponse {}

export const SecurityEventNotificationRequestSchema = {
  $id: 'SecurityEventNotificationRequest',
  type: 'object',
  additionalProperties: true,
  properties: {
    type: { type: 'string', maxLength: 50 },
    timestamp: { type: 'string', format: 'date-time' },
    techInfo: { type: 'string', maxLength: 255 },
  },
  required: ['type', 'timestamp'],
};

export const SecurityEventNotificationResponseSchema = {
  $id: 'SecurityEventNotificationResponse',
  type: 'object',
  additionalProperties: true,
  properties: {},
};
