// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * `MessageConfirmation` is the return shape the legacy CitrineOS REST API
 * uses for every CSMS-initiated call (TriggerMessage / Reset / Get* / Set* /
 * Remote* / etc.). Mirrors `base/src/interfaces/messages/MessageConfirmation.ts`.
 *
 * One `MessageConfirmation` per identifier (stationId) — when the request
 * targets multiple chargers, the API returns an array of these in stationId
 * order.
 */
export interface MessageConfirmation {
  success: boolean;
  payload?: Record<string, unknown> | string;
}
