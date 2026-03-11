// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * generate-openapi.ts
 *
 * Standalone script that spins up a minimal Fastify instance, registers
 * Swagger + every module API class (with a stub IModule), then dumps the
 * resulting OpenAPI JSON to docs/static/openapi.json.
 *
 * No database, no RabbitMQ, no Redis — just route registration.
 *
 * Usage:
 *   npx tsx Server/src/scripts/generate-openapi.ts
 *   (or via:  npm run docs:openapi  from the workspace root)
 */

import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import fastify from 'fastify';
import { type JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

import { initSwagger } from '@citrineos/util';
import type { IModule, SystemConfig } from '@citrineos/base';

import { CertificatesDataApi, CertificatesOcpp201Api } from '@citrineos/certificates';
import {
  ConfigurationDataApi,
  ConfigurationOcpp16Api,
  ConfigurationOcpp201Api,
} from '@citrineos/configuration';
import { EVDriverDataApi, EVDriverOcpp16Api, EVDriverOcpp201Api } from '@citrineos/evdriver';
import { MonitoringDataApi, MonitoringOcpp201Api } from '@citrineos/monitoring';
import { AdminApi } from '@citrineos/ocpprouter';
import { ReportingOcpp16Api, ReportingOcpp201Api } from '@citrineos/reporting';
import { SmartChargingOcpp16Api, SmartChargingOcpp201Api } from '@citrineos/smartcharging';
import { TenantDataApi } from '@citrineos/tenant';
import { TransactionsDataApi, TransactionsOcpp201Api } from '@citrineos/transactions';
import { createLocalConfig } from '../config/envs/local.js'; // ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Minimal SystemConfig — only needs the fields AbstractModuleApi reads:
//   config.util.swagger, config.modules.<name>.endpointPrefix
// ---------------------------------------------------------------------------
const config = createLocalConfig();

// ---------------------------------------------------------------------------
// Stub IModule — AbstractModuleApi only ever reads .config from the module
// (to get endpointPrefix and swagger flags). Everything else is a no-op.
// ---------------------------------------------------------------------------
function makeStub(moduleConfig: SystemConfig): IModule {
  return {
    config: moduleConfig,
    ocppValidator: {} as any,
    cache: {} as any,
    sender: {} as any,
    handler: {} as any,
    sendCall: async () => ({ success: true }),
    sendCallResult: async () => ({ success: true }),
    sendCallError: async () => ({ success: true }),
    handle: async () => {},
    shutdown: async () => {},
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const server = fastify().withTypeProvider<JsonSchemaToTsProvider>();

  // Register Swagger — must happen before routes
  await initSwagger(config, server as any);

  const stub = makeStub(config);

  // Register all module API classes.
  // AbstractModuleApi._init() runs in the constructor and calls server.route()
  // for every @AsDataEndpoint / @AsMessageEndpoint decorated method.
  new CertificatesOcpp201Api(stub as any, server as any, undefined);
  new CertificatesDataApi(stub as any, server as any, {} as any, [], undefined);

  new ConfigurationOcpp201Api(stub as any, server as any, undefined);
  new ConfigurationOcpp16Api(stub as any, server as any, undefined);
  new ConfigurationDataApi(stub as any, server as any, undefined);

  new EVDriverOcpp201Api(stub as any, server as any, undefined);
  new EVDriverOcpp16Api(stub as any, server as any, undefined);
  new EVDriverDataApi(stub as any, server as any, undefined);

  new MonitoringOcpp201Api(stub as any, server as any, undefined);
  new MonitoringDataApi(stub as any, server as any, undefined);

  new ReportingOcpp201Api(stub as any, server as any, undefined);
  new ReportingOcpp16Api(stub as any, server as any, undefined);

  new SmartChargingOcpp201Api(stub as any, server as any, undefined);
  new SmartChargingOcpp16Api(stub as any, server as any, undefined);

  new TransactionsOcpp201Api(stub as any, server as any, undefined);
  new TransactionsDataApi(stub as any, server as any, undefined);

  new TenantDataApi(stub as any, server as any, undefined);

  // AdminApi (OcppRouter) takes router + networkConnection — stub both
  new AdminApi(
    {
      config,
    } as any, // IMessageRouter
    {} as any, // WebsocketNetworkConnection
    server as any,
    config as any,
    undefined,
    {} as any, // subscriptionRepository
    {} as any, // serverNetworkProfileRepository
  );

  // Wait for all plugins to finish registering
  await server.ready();

  // Extract the OpenAPI JSON via Fastify's inject (no HTTP port needed)
  const response = await server.inject({ method: 'GET', url: '/docs/json' });

  if (response.statusCode !== 200) {
    console.error('Failed to fetch OpenAPI JSON:', response.statusCode, response.body);
    process.exit(1);
  }

  // Write to docs/static/openapi.json (relative to workspace root)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(__dirname, '../../../docs/static');
  const outFile = path.join(outDir, 'openapi.json');

  console.log('writing', JSON.parse(response.body));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(JSON.parse(response.body), null, 2), 'utf-8');

  console.log(`✅  OpenAPI spec written to ${outFile}`);
  await server.close();
}

main().catch((err) => {
  console.error('generate-openapi failed:', err);
  process.exit(1);
});
