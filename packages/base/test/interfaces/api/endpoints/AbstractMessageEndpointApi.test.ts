// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { EventGroup, OCPP_CallAction, OCPPVersion, type SystemConfig } from '@citrineos/types';
import fastify, { type FastifyInstance } from 'fastify';
import { Logger, type ILogObj } from 'tslog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AbstractMessageEndpoint,
  type IMessageEndpointDeclaration,
} from '../../../../src/interfaces/api/endpoints/AbstractMessageEndpoint.js';
import { AbstractMessageEndpointApi } from '../../../../src/interfaces/api/endpoints/AbstractMessageEndpointApi.js';
import type { BuiltMessageEndpoint } from '../../../../src/interfaces/api/endpoints/buildMessageEndpoints.js';
import type { IMessageConfirmation } from '../../../../src/interfaces/messages/index.js';
import { aSystemConfig } from '../../../providers/systemConfig.js';

const BODY_SCHEMA = {
  $id: 'TestRequestSchema',
  type: 'object',
  properties: { value: { type: 'string' } },
  required: ['value'],
};

class TestApi extends AbstractMessageEndpointApi {}

class RecordingEndpoint extends AbstractMessageEndpoint {
  public readonly calls: Array<{
    identifiers: string[];
    request: unknown;
    callbackUrl: string | undefined;
    tenantId: number | undefined;
    version: OCPPVersion;
    extraQueries: Record<string, unknown> | undefined;
  }> = [];

  async handle(
    identifiers: string[],
    request: unknown,
    callbackUrl: string | undefined,
    tenantId: number | undefined,
    version: OCPPVersion,
    extraQueries?: Record<string, unknown>,
  ): Promise<IMessageConfirmation[]> {
    this.calls.push({ identifiers, request, callbackUrl, tenantId, version, extraQueries });
    return [{ success: true, payload: 'ok' }];
  }
}

interface Harness {
  server: FastifyInstance;
  routes: Array<{ method: string; url: string }>;
  endpoint: RecordingEndpoint;
}

function aRoute(overrides: Partial<IMessageEndpointDeclaration> = {}): IMessageEndpointDeclaration {
  return {
    action: OCPP_CallAction.CertificateSigned,
    protocols: [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
    eventGroup: EventGroup.Certificates,
    bodySchema: () => BODY_SCHEMA,
    ...overrides,
  };
}

async function buildHarness(
  route: IMessageEndpointDeclaration,
  config: SystemConfig,
): Promise<Harness> {
  const server = fastify();
  const routes: Array<{ method: string; url: string }> = [];
  server.addHook('onRoute', (options) => {
    const methods = Array.isArray(options.method) ? options.method : [options.method];
    for (const method of methods) {
      routes.push({ method, url: options.url });
    }
  });

  const endpoint = new RecordingEndpoint(new Logger<ILogObj>({ type: 'hidden' }));
  const built: BuiltMessageEndpoint[] = [{ route, endpoint }];
  new TestApi(server, config, built, new Logger<ILogObj>({ type: 'hidden' }));

  await server.ready();
  return { server, routes, endpoint };
}

describe('AbstractMessageEndpointApi', () => {
  describe('route registration', () => {
    it('registers one route per declared protocol', async () => {
      const { routes } = await buildHarness(aRoute(), aSystemConfig());

      expect(routes.map((r) => r.url).sort()).toEqual([
        '/ocpp/2.0.1/certificates/certificateSigned',
        '/ocpp/2.1/certificates/certificateSigned',
      ]);
      expect(routes.every((r) => r.method === 'POST')).toBe(true);
    });

    it('lowercases the first letter of the action in the URL', async () => {
      const { routes } = await buildHarness(
        aRoute({
          action: OCPP_CallAction.GetInstalledCertificateIds,
          protocols: [OCPPVersion.OCPP2_0_1],
        }),
        aSystemConfig(),
      );

      expect(routes[0].url).toBe('/ocpp/2.0.1/certificates/getInstalledCertificateIds');
    });

    it('strips the ocpp prefix from the version segment', async () => {
      const { routes } = await buildHarness(
        aRoute({ protocols: [OCPPVersion.OCPP1_6] }),
        aSystemConfig(),
      );

      expect(routes[0].url).toBe('/ocpp/1.6/certificates/certificateSigned');
    });

    it('skips a protocol whose body schema is unavailable', async () => {
      const { routes } = await buildHarness(
        aRoute({
          bodySchema: (version) => (version === OCPPVersion.OCPP2_1 ? BODY_SCHEMA : undefined),
        }),
        aSystemConfig(),
      );

      expect(routes.map((r) => r.url)).toEqual(['/ocpp/2.1/certificates/certificateSigned']);
    });

    it('registers the route even when the module is absent from config', async () => {
      const config = aSystemConfig();
      const { certificates: _omitted, ...modules } = config.modules;
      const { routes } = await buildHarness(aRoute(), { ...config, modules });

      expect(routes.map((r) => r.url).sort()).toEqual([
        '/ocpp/2.0.1/certificates/certificateSigned',
        '/ocpp/2.1/certificates/certificateSigned',
      ]);
    });

    it('registers routes through an encapsulated scope when exposeMessage is on', async () => {
      const config = aSystemConfig();
      const { routes } = await buildHarness(aRoute({ protocols: [OCPPVersion.OCPP2_0_1] }), {
        ...config,
        util: { ...config.util, swagger: { ...config.util.swagger!, exposeMessage: true } },
      });

      expect(routes.map((r) => r.url)).toEqual(['/ocpp/2.0.1/certificates/certificateSigned']);
    });
  });

  describe('request handling', () => {
    const url = '/ocpp/2.0.1/certificates/certificateSigned';
    let harness: Harness;

    beforeEach(async () => {
      harness = await buildHarness(
        aRoute({
          protocols: [OCPPVersion.OCPP2_0_1],
          optionalQuerystrings: { websocketServerConfigId: { type: 'string' } },
        }),
        aSystemConfig(),
      );
    });

    it('normalizes a single identifier into an array', async () => {
      const response = await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&tenantId=1`,
        payload: { value: 'x' },
      });

      expect(response.statusCode).toBe(200);
      expect(harness.endpoint.calls[0].identifiers).toEqual(['cs001']);
    });

    it('passes repeated identifiers through as an array', async () => {
      await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&identifier=cs002&tenantId=1`,
        payload: { value: 'x' },
      });

      expect(harness.endpoint.calls[0].identifiers).toEqual(['cs001', 'cs002']);
    });

    it('threads tenantId, callbackUrl and version to the endpoint', async () => {
      await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&tenantId=7&callbackUrl=http://cb`,
        payload: { value: 'x' },
      });

      expect(harness.endpoint.calls[0]).toMatchObject({
        tenantId: 7,
        callbackUrl: 'http://cb',
        version: OCPPVersion.OCPP2_0_1,
        request: { value: 'x' },
      });
    });

    it('forwards declared extra querystrings as extraQueries', async () => {
      await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&tenantId=1&websocketServerConfigId=ws-1`,
        payload: { value: 'x' },
      });

      expect(harness.endpoint.calls[0].extraQueries).toEqual({ websocketServerConfigId: 'ws-1' });
    });

    it('leaves extraQueries undefined when only the standard querystrings are present', async () => {
      await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&tenantId=1`,
        payload: { value: 'x' },
      });

      expect(harness.endpoint.calls[0].extraQueries).toBeUndefined();
    });

    it('rejects a body that fails the declared schema', async () => {
      const response = await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&tenantId=1`,
        payload: { wrong: 'x' },
      });

      expect(response.statusCode).toBe(400);
      expect(harness.endpoint.calls).toHaveLength(0);
    });

    it('returns the confirmations the endpoint produced', async () => {
      const response = await harness.server.inject({
        method: 'POST',
        url: `${url}?identifier=cs001&tenantId=1`,
        payload: { value: 'x' },
      });

      expect(response.json()).toEqual([{ success: true, payload: 'ok' }]);
    });
  });

  it('shares one endpoint instance across every protocol it serves', async () => {
    const { server, endpoint } = await buildHarness(aRoute(), aSystemConfig());

    for (const version of ['2.0.1', '2.1']) {
      await server.inject({
        method: 'POST',
        url: `/ocpp/${version}/certificates/certificateSigned?identifier=cs001&tenantId=1`,
        payload: { value: 'x' },
      });
    }

    expect(endpoint.calls.map((c) => c.version)).toEqual([
      OCPPVersion.OCPP2_0_1,
      OCPPVersion.OCPP2_1,
    ]);
  });

  it('takes the prefix segment from the declared event group', async () => {
    const config = aSystemConfig();
    const { routes } = await buildHarness(
      aRoute({ eventGroup: EventGroup.Monitoring, protocols: [OCPPVersion.OCPP2_0_1] }),
      config,
    );

    expect(routes[0].url).toBe('/ocpp/2.0.1/monitoring/certificateSigned');
    expect(EventGroup.Monitoring).toBe('monitoring');
  });

  it('surfaces an endpoint failure as a 500 without crashing the server', async () => {
    const route = aRoute({ protocols: [OCPPVersion.OCPP2_0_1] });
    const server = fastify();
    const endpoint = new RecordingEndpoint(new Logger<ILogObj>({ type: 'hidden' }));
    vi.spyOn(endpoint, 'handle').mockRejectedValue(new Error('boom'));
    new TestApi(
      server,
      aSystemConfig(),
      [{ route, endpoint }],
      new Logger<ILogObj>({ type: 'hidden' }),
    );
    await server.ready();

    const response = await server.inject({
      method: 'POST',
      url: '/ocpp/2.0.1/certificates/certificateSigned?identifier=cs001&tenantId=1',
      payload: { value: 'x' },
    });

    expect(response.statusCode).toBe(500);
  });
});
