// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcppRequest } from '../../../internal-types.js';

export interface SecurityEventNotificationRequest extends OcppRequest {
  type: string;
  timestamp: string;
  techInfo?: string;
}
