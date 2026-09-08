// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * C25: Request body for the POST /evdriver/webpayment/initiate endpoint.
 * Used when a driver scans a QR code and the CSMS web page calls back
 * to initiate the web payment session.
 */
export interface InitiateWebPaymentRequest {
  /** Charging station ID extracted from the QR URL */
  identifier: string;
  /** EVSE ID from the QR URL */
  evseId: number;
  /** TOTP value from the QR URL for validation (C25.FR.07-09) */
  totp: string;
  /** Maximum cost in currency units (C25.FR.56) */
  maxCost?: number;
  /** Maximum duration in seconds (C25.FR.57) */
  maxTime?: number;
  /** Maximum energy in Wh (C25.FR.58) */
  maxEnergy?: number;
  /** EVSE lock timeout in seconds (default: 300) */
  timeout?: number;
  /** Tenant ID (default: DEFAULT_TENANT_ID) */
  tenantId?: number;
}

/**
 * JSON Schema for the InitiateWebPaymentRequest endpoint body.
 * Used as the Fastify route schema for POST /evdriver/webpayment/initiate.
 */
export const InitiateWebPaymentRequestSchema = {
  type: 'object',
  required: ['identifier', 'evseId', 'totp'],
  properties: {
    identifier: { type: 'string', description: 'Charging station ID extracted from the QR URL' },
    evseId: { type: 'integer', minimum: 0, description: 'EVSE ID from the QR URL' },
    totp: { type: 'string', description: 'TOTP value from the QR URL for validation' },
    maxCost: { type: 'number', description: 'Maximum cost in currency units (C25.FR.56)' },
    maxTime: {
      type: 'integer',
      minimum: 0,
      description: 'Maximum duration in seconds (C25.FR.57)',
    },
    maxEnergy: { type: 'number', minimum: 0, description: 'Maximum energy in Wh (C25.FR.58)' },
    timeout: {
      type: 'integer',
      minimum: 1,
      description: 'EVSE lock timeout in seconds (default: 300)',
    },
    tenantId: { type: 'integer', description: 'Tenant ID (default: DEFAULT_TENANT_ID)' },
  },
} as const;
