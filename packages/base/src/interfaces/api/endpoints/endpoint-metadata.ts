// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { HttpMethod } from '@citrineos/types';

// Interface for command endpoint metadata and includes the admin endpoints as well
export interface ICommandEndpointMetadata {
  method: HttpMethod;
  path: string;
  querySchema?: object;
  bodySchema?: object;
  responseSchema?: object;
  tags?: string[];
  description?: string;
}
