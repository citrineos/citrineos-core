// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/src/modules/index.ts   (integrate owner)
// Barrel of every ModuleDef the registry mounts. The order here is the order the
// routes are registered; it has no functional effect (Fastify keys on method+url)
// but keeps versions/credentials first for readability.
// ============================================================================
import type { ModuleDef } from '../core/types.js';
import { versionsModule } from './versions.js';
import { credentialsModule } from './credentials.js';
import { locationsModule } from './locations.js';
import { tariffsModule } from './tariffs.js';
import { sessionsModule } from './sessions.js';
import { cdrsModule } from './cdrs.js';
import { chargingprofilesModule } from './chargingprofiles.js';
import { tokensModule } from './tokens.js';
import { commandsModule } from './commands.js';

export {
  versionsModule,
  credentialsModule,
  locationsModule,
  tariffsModule,
  sessionsModule,
  cdrsModule,
  chargingprofilesModule,
  tokensModule,
  commandsModule,
};

// The full set consumed by registerAllModules(app, ctx).
export const allModules: ModuleDef[] = [
  versionsModule,
  credentialsModule,
  locationsModule,
  tariffsModule,
  sessionsModule,
  cdrsModule,
  chargingprofilesModule,
  tokensModule,
  commandsModule,
];
