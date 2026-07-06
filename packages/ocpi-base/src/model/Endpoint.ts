// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ModuleId } from './ModuleId.js';
import { InterfaceRole } from './InterfaceRole.js';

export const EndpointSchema = z.object({
  identifier: z.nativeEnum(ModuleId),
  role: z.nativeEnum(InterfaceRole),
  url: z.string().url(),
});

export type Endpoint = z.infer<typeof EndpointSchema>;
