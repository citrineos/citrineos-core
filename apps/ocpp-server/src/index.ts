// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConfigLoader } from '@citrineos/base';
import { CitrineOSServer } from '@citrineos/core';
import { EventGroup } from '@citrineos/types';

async function main() {
  const config = await ConfigLoader.loadConfig();
  const server = new CitrineOSServer(process.env.APP_NAME?.toLowerCase() as EventGroup, config);
  server.run().catch((error: any) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
