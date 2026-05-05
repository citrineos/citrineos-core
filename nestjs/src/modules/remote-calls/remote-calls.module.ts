// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';
import { RemoteCommandRepository } from '@repositories/remote-command.repository';

/**
 * Available everywhere — modules use this to fire CSMS-initiated CALLs at
 * connected chargers and await their CALL_RESULT. Works in any deployment
 * topology (single-process / split router-modules).
 *
 * Read-side queries on `RemoteCommands` are exposed via Hasura — no
 * bespoke REST controller needed.
 */
@Global()
@Module({
  providers: [RemoteCallsService, RemoteCallDispatcher, RemoteCommandRepository],
  exports: [RemoteCallsService, RemoteCallDispatcher, RemoteCommandRepository],
})
export class RemoteCallsModule {}
