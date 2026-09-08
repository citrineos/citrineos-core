// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { MessageFormatEnumSchema } from './enums.js';

export const MessageContentSchema = z.object({
  format: MessageFormatEnumSchema,
  language: z.string().nullable().optional(),
  content: z.string(),
  customData: z.any().nullable().optional(),
});

export type MessageContent = z.infer<typeof MessageContentSchema>;
