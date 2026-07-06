// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ResponseUrlSchema } from './ResponseUrl.js';

export const UnlockConnectorSchema = ResponseUrlSchema.extend({
  location_id: z.string().max(36).min(1),
  evse_uid: z.string().max(36).min(1),
  connector_id: z.string().max(36).min(1),
});
export const UnlockConnectorSchemaName = 'UnlockConnector';

export type UnlockConnector = z.infer<typeof UnlockConnectorSchema>;
