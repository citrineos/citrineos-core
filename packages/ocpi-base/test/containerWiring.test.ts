// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { afterEach, describe, expect, it } from 'vitest';
import { Container } from 'typedi';
import { Logger } from 'tslog';

import { CommandsService } from '../src/services/CommandsService.js';
import { CommandExecutor } from '../src/util/CommandExecutor.js';
import { OcpiGraphqlClient } from '../src/graphql/index.js';
import { OcpiConfigToken } from '../src/config/ocpi.types.js';

/**
 * The property injections resolve through the container rather than from decorator metadata, so
 * this covers the wiring itself: a lazy token that names the wrong class still loads, and only
 * fails when something asks the container for the service.
 */
describe('container wiring', () => {
  afterEach(() => {
    Container.reset();
  });

  it('resolves the collaborators of a service built by the container', () => {
    const logger = new Logger({ type: 'hidden' });
    const graphqlClient = {} as OcpiGraphqlClient;
    const commandExecutor = {} as CommandExecutor;

    Container.set(Logger, logger);
    Container.set(OcpiGraphqlClient, graphqlClient);
    Container.set(CommandExecutor, commandExecutor);
    Container.set(OcpiConfigToken, { commands: { timeout: 30 } });

    const service = Container.get(CommandsService);

    expect(service).toBeInstanceOf(CommandsService);
    expect(service['logger']).toBe(logger);
    expect(service['ocpiGraphqlClient']).toBe(graphqlClient);
    expect(service['commandExecutor']).toBe(commandExecutor);
    expect(service.config.commands.timeout).toBe(30);
  });
});
