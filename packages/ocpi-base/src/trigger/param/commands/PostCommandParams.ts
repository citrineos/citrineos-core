// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiParamsSchema } from '../../util/OcpiParams.js';
import { CommandResultSchema } from '../../../model/CommandResult.js';

export const PostCommandParamsSchema = OcpiParamsSchema.extend({
  url: z.string().min(1),
  commandResult: CommandResultSchema,
});

export type PostCommandParams = z.infer<typeof PostCommandParamsSchema>;
