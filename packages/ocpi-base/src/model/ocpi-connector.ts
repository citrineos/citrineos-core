// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const OcpiConnectorSchema = z.object({
  connectorId: z.number(),
  evseId: z.string(),
  stationId: z.string(),
  lastUpdated: z.date(),
});

export type OcpiConnector = z.infer<typeof OcpiConnectorSchema>;
