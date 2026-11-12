// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractEndpointApi,
  type AbstractEndpoint,
  type BuiltEndpoint,
  type ICommandEndpointMetadata,
} from '@citrineos/base';
import fastify, { type FastifyInstance } from 'fastify';
import { Logger, type ILogObj } from 'tslog';

export type EndpointClass = (new (...args: any[]) => AbstractEndpoint) & {
  route: ICommandEndpointMetadata;
};

class HarnessApi extends AbstractEndpointApi {}

export function aCapturingLogger(): { logger: Logger<ILogObj>; errors: ILogObj[] } {
  const errors: ILogObj[] = [];
  const logger = new Logger<ILogObj>({ type: 'hidden', minLevel: 5 });
  logger.attachTransport((logObj) => {
    errors.push(logObj);
  });
  return { logger, errors };
}

export interface MountedEndpoint {
  server: FastifyInstance;
  logger: Logger<ILogObj>;
  loggedErrors: ILogObj[];
}

export async function mountEndpoint(
  endpoint: AbstractEndpoint,
  route: ICommandEndpointMetadata,
  prefix = '/commands',
  /** Runs before the route is registered, e.g. to add hooks standing in for the auth plugin. */
  prepare?: (server: FastifyInstance) => void,
): Promise<MountedEndpoint> {
  const server = fastify();
  prepare?.(server);
  const { logger, errors } = aCapturingLogger();
  const built: BuiltEndpoint[] = [{ route, endpoint }];

  new HarnessApi(server, prefix, built, logger);
  await server.ready();

  return { server, logger, loggedErrors: errors };
}
