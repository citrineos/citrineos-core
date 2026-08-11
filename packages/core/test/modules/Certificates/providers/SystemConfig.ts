// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { SystemConfig, configSchema } from '@citrineos/types';

export function aSystemConfig(override?: Partial<SystemConfig>): SystemConfig {
  return configSchema.parse({ ...override });
}
