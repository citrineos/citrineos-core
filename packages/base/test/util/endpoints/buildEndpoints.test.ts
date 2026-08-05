// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { HttpMethod, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Logger, type ILogObj } from 'tslog';
import { describe, expect, it } from 'vitest';
import { AbstractEndpoint } from '../../../src/interfaces/api/endpoints/AbstractEndpoint.js';
import {
  AbstractMessageEndpoint,
  type IMessageEndpointDeclaration,
} from '../../../src/interfaces/api/endpoints/AbstractMessageEndpoint.js';
import { buildEndpoints } from '../../../src/util/endpoints/buildEndpoints.js';
import type {
  EndpointClass,
  IEndpointBuilder,
} from '../../../src/interfaces/api/endpoints/buildEndpoints.js';
import { buildMessageEndpoints } from '../../../src/util/endpoints/buildMessageEndpoints.js';
import type { MessageEndpointClass } from '../../../src/interfaces/api/endpoints/buildMessageEndpoints.js';
import type { IEndpointDefinition } from '../../../src/interfaces/api/endpoints/EndpointDefinition.js';
import type { IMessageConfirmation } from '../../../src/interfaces/messages/index.js';

const silentLogger = () => new Logger<ILogObj>({ type: 'hidden' });

function aBuilder(): IEndpointBuilder & { built: unknown[] } {
  const built: unknown[] = [];
  return {
    built,
    build<T>(target: new (...args: never[]) => T): T {
      built.push(target);
      return new target();
    },
  };
}

class FirstEndpoint extends AbstractEndpoint {
  static readonly route: IEndpointDefinition = { method: HttpMethod.Post, path: '/first' };
  constructor() {
    super(silentLogger());
  }
  async handle(_request: FastifyRequest, _reply: FastifyReply): Promise<unknown> {
    return { ok: 'first' };
  }
}

class SecondEndpoint extends AbstractEndpoint {
  static readonly route: IEndpointDefinition = { method: HttpMethod.Delete, path: '/second' };
  constructor() {
    super(silentLogger());
  }
  async handle(_request: FastifyRequest, _reply: FastifyReply): Promise<unknown> {
    return { ok: 'second' };
  }
}

class AMessageEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.Reset,
    protocols: [OCPPVersion.OCPP2_0_1],
    endpointPrefixConfigKey: 'configuration',
    bodySchema: () => ({ $id: 'ResetRequestSchema', type: 'object' }),
  };

  constructor() {
    super(silentLogger());
  }

  async handle(): Promise<IMessageConfirmation[]> {
    return [{ success: true }];
  }
}

describe('buildEndpoints', () => {
  it('carries each class static route onto its built entry', () => {
    const endpointClasses: ReadonlyArray<EndpointClass> = [FirstEndpoint, SecondEndpoint];

    const built = buildEndpoints(aBuilder(), endpointClasses);

    expect(built.map((entry) => entry.route)).toEqual([FirstEndpoint.route, SecondEndpoint.route]);
  });

  it('preserves declaration order', () => {
    const built = buildEndpoints(aBuilder(), [SecondEndpoint, FirstEndpoint]);

    expect(built.map((entry) => entry.route.path)).toEqual(['/second', '/first']);
  });

  it('resolves every endpoint through the injected builder', () => {
    const builder = aBuilder();

    buildEndpoints(builder, [FirstEndpoint, SecondEndpoint]);

    expect(builder.built).toEqual([FirstEndpoint, SecondEndpoint]);
  });

  it('pairs each route with an instance of its own class', () => {
    const built = buildEndpoints(aBuilder(), [FirstEndpoint, SecondEndpoint]);

    expect(built[0].endpoint).toBeInstanceOf(FirstEndpoint);
    expect(built[1].endpoint).toBeInstanceOf(SecondEndpoint);
  });

  it('returns an empty list for an empty declaration list', () => {
    expect(buildEndpoints(aBuilder(), [])).toEqual([]);
  });
});

describe('buildMessageEndpoints', () => {
  it('carries the message declaration onto its built entry', () => {
    const endpointClasses: ReadonlyArray<MessageEndpointClass> = [AMessageEndpoint];

    const built = buildMessageEndpoints(aBuilder(), endpointClasses);

    expect(built).toHaveLength(1);
    expect(built[0].route).toBe(AMessageEndpoint.route);
    expect(built[0].endpoint).toBeInstanceOf(AMessageEndpoint);
  });
});
