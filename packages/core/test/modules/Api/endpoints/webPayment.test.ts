// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CacheNamespace, DEFAULT_TENANT_ID } from '@citrineos/base';
import { AttributeEnum, EventGroup, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TotpUtil } from '@util';
import { InitiateWebPaymentEndpoint } from '@modules/Api/src/module/endpoints/webPayment/InitiateWebPaymentEndpoint.js';
import { WebPaymentApi } from '@modules/Api/src/module/WebPaymentApi.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const ENDPOINT_PREFIX = '/evdriver';
const URL = `${ENDPOINT_PREFIX}/webpayment/initiate`;

describe(`POST ${URL}`, () => {
  const STATION_ID = 'CS-001';
  const EVSE_ID = 1;
  const SHARED_SECRET = '12345678901234567890';

  const { container, logger } = createTestContainer();

  let readAllByQuerystring: ReturnType<typeof vi.fn>;
  let cacheSet: ReturnType<typeof vi.fn>;
  let sendCall: ReturnType<typeof vi.fn>;
  let server: FastifyInstance;

  beforeEach(async () => {
    readAllByQuerystring = vi.fn();
    cacheSet = vi.fn().mockResolvedValue(undefined);
    sendCall = vi.fn().mockResolvedValue(undefined);

    const endpoint = getTestInstance(container, InitiateWebPaymentEndpoint, {
      ocppSender: { sendCall },
      cache: { set: cacheSet },
      deviceModelRepository: { readAllByQuerystring },
    });

    server = Fastify({ logger: false });
    new WebPaymentApi({
      server,
      webPaymentEndpoints: [{ route: InitiateWebPaymentEndpoint.route, endpoint }],
      logger,
    });
    await server.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await server.close();
  });

  describe('request schema validation', () => {
    it('returns 400 when identifier is missing', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { evseId: EVSE_ID, totp: '123456' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when evseId is missing', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, totp: '123456' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when totp is missing', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when evseId is negative', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: -1, totp: '123456' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when timeout is zero (minimum is 1)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', timeout: 0 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('shared secret lookup', () => {
    it('returns 503 when WebPaymentsCtrlr.SharedSecret is not configured', async () => {
      readAllByQuerystring.mockResolvedValue([]);

      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({ error: 'Web payment not configured for this station.' });
    });

    it('returns 503 when the device model repository throws', async () => {
      readAllByQuerystring.mockRejectedValue(new Error('DB connection lost'));

      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({
        error: 'Failed to read station configuration. Please try again.',
      });
    });

    it('queries the device model with the correct parameters', async () => {
      readAllByQuerystring.mockResolvedValue([]);

      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', tenantId: 42 },
      });

      expect(readAllByQuerystring).toHaveBeenCalledWith(42, {
        tenantId: 42,
        ocppConnectionName: STATION_ID,
        component_name: 'WebPaymentsCtrlr',
        variable_name: 'SharedSecret',
        type: AttributeEnum.Actual,
      });
    });
  });

  describe('TOTP validation (C25.FR.07-09)', () => {
    beforeEach(() => {
      readAllByQuerystring.mockResolvedValue([{ value: SHARED_SECRET }]);
    });

    it('returns 401 when TOTP is invalid', async () => {
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(false);

      const res = await server.inject({
        method: 'POST',
        url: URL,
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
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '000000' },
      });

      expect(cacheSet).not.toHaveBeenCalled();
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('calls TotpUtil.validate with the shared secret and the provided totp', async () => {
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(false);

      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '654321' },
      });

      expect(TotpUtil.validate).toHaveBeenCalledWith(SHARED_SECRET, '654321');
    });
  });

  describe('successful initiation', () => {
    beforeEach(() => {
      readAllByQuerystring.mockResolvedValue([{ value: SHARED_SECRET }]);
      vi.spyOn(TotpUtil, 'validate').mockReturnValue(true);
    });

    it('returns 200 with success payload', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
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
        url: URL,
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
      expect(cacheSet).toHaveBeenCalledWith(
        `webpayment:${DEFAULT_TENANT_ID}:${STATION_ID}:${EVSE_ID}`,
        JSON.stringify({ maxCost: 12.34, maxTime: 3600, maxEnergy: 50000 }),
        CacheNamespace.Other,
        120,
      );
    });

    it('uses default timeout of 300s when not provided', async () => {
      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(cacheSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        CacheNamespace.Other,
        300,
      );
    });

    it('caches undefined limits when no limits are provided', async () => {
      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(cacheSet).toHaveBeenCalledWith(
        `webpayment:${DEFAULT_TENANT_ID}:${STATION_ID}:${EVSE_ID}`,
        JSON.stringify({ maxCost: undefined, maxTime: undefined, maxEnergy: undefined }),
        CacheNamespace.Other,
        300,
      );
    });

    it('sends NotifyWebPaymentStarted to the charging station (C25.FR.21-22)', async () => {
      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', timeout: 180 },
      });

      expect(sendCall).toHaveBeenCalledWith({
        ocppConnectionName: STATION_ID,
        tenantId: DEFAULT_TENANT_ID,
        protocol: OCPPVersion.OCPP2_1,
        action: OCPP_CallAction.NotifyWebPaymentStarted,
        eventGroup: EventGroup.EVDriver,
        payload: { evseId: EVSE_ID, timeout: 180 },
      });
    });

    it('still returns 200 when NotifyWebPaymentStarted fails (non-fatal per C25.FR.21)', async () => {
      sendCall.mockRejectedValue(new Error('Station unreachable'));

      const res = await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ success: true });
    });

    it('uses DEFAULT_TENANT_ID when tenantId is not provided', async () => {
      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456' },
      });

      expect(readAllByQuerystring).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ tenantId: DEFAULT_TENANT_ID }),
      );
    });

    it('uses the provided tenantId when given', async () => {
      await server.inject({
        method: 'POST',
        url: URL,
        payload: { identifier: STATION_ID, evseId: EVSE_ID, totp: '123456', tenantId: 7 },
      });

      expect(readAllByQuerystring).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ tenantId: 7 }),
      );
    });

    it('returns the timeout and limits in the response body', async () => {
      const res = await server.inject({
        method: 'POST',
        url: URL,
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
