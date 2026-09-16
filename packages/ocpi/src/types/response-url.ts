// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export const ResponseUrlSchema = z.object({
  response_url: z.string().url(),
});

export type ResponseUrl = z.infer<typeof ResponseUrlSchema>;
