// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { EventGroup, loadBootstrapConfig } from '@citrineos/base';
import { getSystemConfig } from './config/index.js';
import { CitrineOSServer } from './citrineOSServer.js';

async function main() {
  const bootstrapConfig = loadBootstrapConfig();
  const config = await getSystemConfig(bootstrapConfig);
  const server = new CitrineOSServer(
    process.env.APP_NAME?.toLowerCase() as EventGroup,
    bootstrapConfig,
    config,
  );
  server.run().catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
