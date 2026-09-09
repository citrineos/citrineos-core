// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { OcpiParamsSchema } from '../../util/ocpi-params.js';
import { CommandResultSchema } from '../../../model/command-result.js';

export const PostCommandParamsSchema = OcpiParamsSchema.extend({
  url: z.string().min(1),
  commandResult: CommandResultSchema,
});

export type PostCommandParams = z.infer<typeof PostCommandParamsSchema>;
