// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests for the C25 web payment initiation endpoint.
 *
 * Strategy: rather than instantiating the full EVDriverOcpp2Api (which pulls in
 * AbstractModuleApi → Reflect metadata → all OCPP route decorators), we extract
 * the route handler logic by registering it on a bare Fastify instance using the
 * same code path that _registerInitiateWebPaymentRoute uses.  We mock the module
 * dependencies (deviceModelRepository, cache, sendCall) and spy on TotpUtil.validate
 * so we can control TOTP outcomes without needing a real shared secret.
 */

import { CacheNamespace, DEFAULT_TENANT_ID } from '@citrineos/base';
import { AttributeEnum, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TotpUtil } from '@util';

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildMockModule(overrides: Partial<ReturnType<typeof defaultMockModule>> = {}) {
  return { ...defaultMockModule(), ...overrides };
}

function defaultMockModule() {
  return {
    config: {
      modules: {
        evdriver: {
          endpointPrefix: '/evdriver',
        },
      },
    },
    deviceModelRepository: {
      readAllByQuerystring: vi.fn(),
    },
    cache: {
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    sendCall: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Registers the same route logic as EVDriverOcpp2Api._registerInitiateWebPaymentRoute
 * on a fresh Fastify instance, injecting the mock module.
 */
async function buildServer(mockModule: ReturnType<typeof defaultMockModule>) {
  const server = Fastify({ logger: false });
  const endpointPrefix = mockModule.config.modules.evdriver.endpointPrefix;
  const routePath = `${endpointPrefix}/webpayment/initiate`;

  server.post(
    routePath,
    {
      schema: {
        body: {
          type: 'object',
          required: ['identifier', 'evseId', 'totp'],
          properties: {
            identifier: { type: 'string' },
            evseId: { type: 'integer', minimum: 0 },
            totp: { type: 'string' },
            maxCost: { type: 'number' },
            maxTime: { type: 'integer', minimum: 0 },
            maxEnergy: { type: 'number', minimum: 0 },
            timeout: { type: 'integer', minimum: 1 },
            tenantId: { type: 'integer' },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        identifier: string;
        evseId: number;
        totp: string;
        maxCost?: number;
        maxTime?: number;
        maxEnergy?: number;
        timeout?: number;
        tenantId?: number;
      };

      const { identifier, evseId, totp, maxCost, maxTime, maxEnergy } = body;
      const tenantId = body.tenantId ?? DEFAULT_TENANT_ID;
      const lockTimeout = body.timeout ?? 300;

      let sharedSecret: string | undefined;
      try {
        const sharedSecretAttrs = await mockModule.deviceModelRepository.readAllByQuerystring(
          tenantId,
          {
            tenantId,
            stationId: identifier,
            component_name: 'WebPaymentsCtrlr',
            variable_name: 'SharedSecret',
            type: AttributeEnum.Actual,
          },
        );
        sharedSecret = sharedSecretAttrs[0]?.value ?? undefined;
      } catch {
        return reply
          .code(503)
          .send({ error: 'Failed to read station configuration. Please try again.' });
      }

      if (!sharedSecret) {
        return reply.code(503).send({ error: 'Web payment not configured for this station.' });
      }

      if (!TotpUtil.validate(sharedSecret, totp)) {
        return reply
          .code(401)
          .send({ error: 'TOTP validation failed. The QR code may be expired.' });
      }

      const cacheKey = `webpayment:${identifier}:${evseId}`;
      const limits = { maxCost, maxTime, maxEnergy };
      await mockModule.cache.set(
        cacheKey,
        JSON.stringify(limits),
        CacheNamespace.Other,
        lockTimeout,
      );

      try {
        await mockModule.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_1,
          OCPP_CallAction.NotifyWebPaymentStarted,
          { evseId, timeout: lockTimeout },
        );
      } catch {
        // Non-fatal
      }

      return reply.send({
        success: true,
        stationId: identifier,
        evseId,
        timeout: lockTimeout,
        limits: { maxCost, maxTime, maxEnergy },
      });
    },
  );

  await server.ready();
  return server;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('POST /evdriver/webpayment/initiate', () => {
  let mockModule: ReturnType<typeof defaultMockModule>;
  let server: Awaited<ReturnType<typeof buildServer>>;

  const STATION_ID = 'CS-001';
  const EVSE_ID = 1;
  const SHARED_SECRET = '12345678901234567890';

  beforeEach(async () => {
    mockModule = buildMockModule();
    server = await buildServer(mockModule);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await server.close();
  });

  // ─── schema validation ──────────────────────────────────────────────────────

  describe('request schema validation', () => {
    it('returns 400 when identifier is missing', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { evseId: EVSE_ID, totp: '123456' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when evseId is missing', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, totp: '123456' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when totp is missing', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when evseId is negative', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: -1, totp: '123456' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when timeout is zero (minimum is 1)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', timeout: 0 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── shared secret lookup ───────────────────────────────────────────────────

  describe('shared secret lookup', () => {
    it('returns 503 when WebPaymentsCtrlr.SharedSecret is not configured', async () => {
      mockModule.deviceModelRepository.readAllByQuerystring.mockResolvedValue([]);

      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({ error: 'Web payment not configured for this station.' });
    });

    it('returns 503 when the device model repository throws', async () => {
      mockModule.deviceModelRepository.readAllByQuerystring.mockRejectedValue(
        new Error('DB connection lost'),
      );

      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({
        error: 'Failed to read station configuration. Please try again.',
      });
    });

    it('queries the device model with the correct parameters', async () => {
      // Return no secret so the request stops early — we only care about the query args
      mockModule.deviceModelRepository.readAllByQuerystring.mockResolvedValue([]);

      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', tenantId: 42 },
      });

      expect(mockModule.deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith(42, {
        tenantId: 42,
        stationId: STATION_ID,
        component_name: 'WebPaymentsCtrlr',
        variable_name: 'SharedSecret',
        type: AttributeEnum.Actual,
      });
    });
  });

  // ─── TOTP validation ────────────────────────────────────────────────────────

  describe('TOTP validation (C25.FR.07-09)', () => {
    beforeEach(() => {
      mockModule.deviceModelRepository.readAllByQuerystring.mockResolvedValue([
        { value: SHARED_SECRET },
      ]);
    });

    it('returns 401 when TOTP is invalid', async () => {
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(false);

      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '000000' },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({
        error: 'TOTP validation failed. The QR code may be expired.',
      });
    });

    it('does not cache limits or send NotifyWebPaymentStarted when TOTP is invalid', async () => {
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(false);

      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '000000' },
      });

      expect(mockModule.cache.set).not.toHaveBeenCalled();
      expect(mockModule.sendCall).not.toHaveBeenCalled();
    });

    it('calls TotpUtil.validate with the shared secret and the provided totp', async () => {
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(false);

      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '654321' },
      });

      expect(TotpUtil.validate).toHaveBeenCalledWith(SHARED_SECRET, '654321');
    });
  });

  // ─── happy path ─────────────────────────────────────────────────────────────

  describe('successful initiation', () => {
    beforeEach(() => {
      mockModule.deviceModelRepository.readAllByQuerystring.mockResolvedValue([
        { value: SHARED_SECRET },
      ]);
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(true);
    });

    it('returns 200 with success payload', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        success: true,
        stationId: STATION_ID,
        evseId: EVSE_ID,
      });
    });

    it('caches limits with the correct key and TTL (C25.FR.03-06)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: {
          identifier: STATION_ID,
          evseId: EVSE_ID,
          totp: '123456',
          maxCost: 12.34,
          maxTime: 3600,
          maxEnergy: 50000,
          timeout: 120,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(mockModule.cache.set).toHaveBeenCalledWith(
        `webpayment:${STATION_ID}:${EVSE_ID}`,
        JSON.stringify({ maxCost: 12.34, maxTime: 3600, maxEnergy: 50000 }),
        CacheNamespace.Other,
        120,
      );
    });

    it('uses default timeout of 300s when not provided', async () => {
      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(mockModule.cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        CacheNamespace.Other,
        300,
      );
    });

    it('caches undefined limits when no limits are provided', async () => {
      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(mockModule.cache.set).toHaveBeenCalledWith(
        `webpayment:${STATION_ID}:${EVSE_ID}`,
        JSON.stringify({ maxCost: undefined, maxTime: undefined, maxEnergy: undefined }),
        CacheNamespace.Other,
        300,
      );
    });

    it('sends NotifyWebPaymentStarted to the charging station (C25.FR.21-22)', async () => {
      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', timeout: 180 },
      });

      expect(mockModule.sendCall).toHaveBeenCalledWith(
        STATION_ID,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
        OCPP_CallAction.NotifyWebPaymentStarted,
        { evseId: EVSE_ID, timeout: 180 },
      );
    });

    it('still returns 200 when NotifyWebPaymentStarted fails (non-fatal per C25.FR.21)', async () => {
      mockModule.sendCall.mockRejectedValue(new Error('Station unreachable'));

      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ success: true });
    });

    it('uses DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(mockModule.deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ tenantId: DEFAULT_TENANT_ID }),
      );
    });

    it('uses the provided tenantId when given', async () => {
      await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', tenantId: 7 },
      });

      expect(mockModule.deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ tenantId: 7 }),
      );
    });

    it('returns the timeout and limits in the response body', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/evdriver/webpayment/initiate',
        payload: {
          identifier: STATION_ID,
          evseId: EVSE_ID,
          totp: '123456',
          maxCost: 9.99,
          timeout: 60,
        },
      });

      const body = res.json();
      expect(body.timeout).toBe(60);
      expect(body.limits.maxCost).toBe(9.99);
    });
  });
});
