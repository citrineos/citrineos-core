// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj, Logger } from 'tslog';
import type { OcpiConfig } from './config/ocpi-types.js';
import type { IOcpiGraphqlClient } from './graphql/ocpi-graphql-client.js';
import type { CacheWrapper } from './util/cache-wrapper.js';

export interface OcpiDependencies {
  logger: Logger<ILogObj>;
}

export interface OcpiConfiguredDependencies extends OcpiDependencies {
  config: OcpiConfig;
}

export interface OcpiGraphqlDependencies extends OcpiDependencies {
  ocpiGraphqlClient: IOcpiGraphqlClient;
}

export type OcpiClientApiDependencies = OcpiGraphqlDependencies;

export interface OcpiModuleDependencies extends OcpiConfiguredDependencies {
  cacheWrapper: CacheWrapper;
}
