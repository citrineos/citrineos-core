// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayTextSchema } from './DisplayText.js';
import { z } from 'zod';
import { OcpiResponseSchema } from './OcpiResponse.js';

export enum CommandResponseType {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
  UNKNOWN_SESSION = 'UNKNOWN_SESSION',
}

export const CommandResponseSchema = z.object({
  result: z.nativeEnum(CommandResponseType),
  timeout: z.number().int().min(0),
  message: DisplayTextSchema.optional(),
});
export const CommandResponseSchemaName = 'CommandResponse';

export type CommandResponse = z.infer<typeof CommandResponseSchema>;

export const OcpiCommandResponseSchema = OcpiResponseSchema(CommandResponseSchema);

export type OcpiCommandResponse = z.infer<typeof OcpiCommandResponseSchema>;
