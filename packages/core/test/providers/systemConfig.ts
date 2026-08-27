// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { configSchema, type SystemConfig, type SystemConfigInput } from '@citrineos/types';

/**
 * A parsed {@link SystemConfig}, built through the real schema so every field the
 * fixture does not name takes its production default. Both certificate authority
 * integrations are opted in with their defaults, since the CA-facing code paths are
 * what tests most often need switched on.
 *
 * @param override Merged over the defaults before parsing, one level deep — pass a
 *   whole block (`{ timeouts: {...} }`), not a leaf inside one.
 */
export function aSystemConfig(override?: Partial<SystemConfigInput>): SystemConfig {
  return configSchema.parse({
    env: 'development',
    swagger: { path: '/docs', logoPath: '/tmp/logo.png', exposeMessage: false },
    integrations: {
      v2gCA: {},
      chargingStationCA: { acme: { accountKeyFilePath: '/tmp/acme_account_key.pem' } },
    },
    ...override,
  } satisfies SystemConfigInput);
}
