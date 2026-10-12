// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

/**
 * - **UpgradeRejected** — refused before the 101 response: a failed TLS handshake, an invalid
 *   handshake, or an authentication failure. Carries an HTTP status when one was sent.
 * - **ConnectionRejected** — upgraded, then closed during connection setup. Carries the close code
 *   we sent.
 */
export const WebsocketEventTypeSchema = z.enum([
  'UpgradeRejected',
  'ConnectionRejected',
  'Open',
  'Close',
]);

export type WebsocketEventType = z.infer<typeof WebsocketEventTypeSchema>;
