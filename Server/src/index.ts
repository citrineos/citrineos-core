// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { loadBootstrapConfig } from '@citrineos/base';
import { CitrineOSServer } from './citrineOSServer.js';
import { getSystemConfig } from './config/index.js';
import { CitrineOSContainer } from '@citrineos/util';

async function main() {
  const bootstrapConfig = loadBootstrapConfig();
  const config = await getSystemConfig(bootstrapConfig);
  const container = new CitrineOSContainer(bootstrapConfig, config, { autobind: true });
  const server: CitrineOSServer = container.get(CitrineOSServer);

  server.run().catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
