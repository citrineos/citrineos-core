// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { configSchema, type SystemConfig, type SystemConfigInput } from '@citrineos/types';

/**
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
