// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { configSchema, type SystemConfig, type SystemConfigInput } from '@citrineos/types';

/**
 * A parsed {@link SystemConfig}, built through the real schema so every field the
 * fixture does not name takes its production default. Only the values a test would
 * otherwise have to reason about are pinned here.
 *
 * @param override Merged over the defaults before parsing, one level deep — pass a
 *   whole block (`{ swagger: {...} }`), not a leaf inside one.
 */
export function aSystemConfig(override?: Partial<SystemConfigInput>): SystemConfig {
  return configSchema.parse({
    env: 'development',
    swagger: { path: '/docs', logoPath: '/tmp/logo.png', exposeMessage: false },
    ...override,
  } satisfies SystemConfigInput);
}
