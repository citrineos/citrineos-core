// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IdTokenEnumType } from './types/enums.js';

export interface RealTimeAuthorizationRequestBody {
  tenantPartnerId: number;
  idToken: string;
  idTokenType: IdTokenEnumType;
  locationId?: string;
  ocppConnectionName: string;
  evseId: number;
  connectorId: number;
}

export interface RealTimeAuthorizationResponse {
  timestamp: string;
  data: {
    allowed: string;
    reason?: string;
  };
}
