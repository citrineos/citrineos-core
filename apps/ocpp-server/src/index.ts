// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Must stay the first import: the metrics provider has to be registered before any other
// @citrineos package loads and creates its instruments. It is synchronous, so ESM evaluates it
// completely before the imports below.
import './instrumentation.js';

import { ConfigLoader } from '@citrineos/base';
import { shutdownMetrics } from '@citrineos/observability';
import { CitrineOSServer } from '@citrineos/ocpp';
import { EventGroup } from '@citrineos/types';

class OcppServer extends CitrineOSServer {
  protected override async onShutdown(): Promise<void> {
    await shutdownMetrics();
  }
}

async function main() {
  const config = await ConfigLoader.loadConfig();
  const server = new OcppServer(process.env.APP_NAME?.toLowerCase() as EventGroup, config);
  server.run().catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
