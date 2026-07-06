// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayTextSchema } from './DisplayText.js';
import { OcpiResponseSchema } from './OcpiResponse.js';
import { z } from 'zod';

export enum CommandResultType {
  ACCEPTED = 'ACCEPTED',
  CANCELED_RESERVATION = 'CANCELED_RESERVATION',
  EVSE_OCCUPIED = 'EVSE_OCCUPIED',
  EVSE_INOPERATIVE = 'EVSE_INOPERATIVE',
  FAILED = 'FAILED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_RESERVATION = 'UNKNOWN_RESERVATION',
}

export const CommandResultSchema = z.object({
  result: z.nativeEnum(CommandResultType),
  message: DisplayTextSchema.optional(),
});

export type CommandResult = z.infer<typeof CommandResultSchema>;

export const OcpiCommandResultSchema = OcpiResponseSchema(CommandResultSchema);

export type OcpiCommandResult = z.infer<typeof OcpiCommandResultSchema>;
