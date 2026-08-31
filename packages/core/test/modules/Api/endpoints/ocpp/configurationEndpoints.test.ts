// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeConfigurationEndpoint } from '@modules/Api/src/module/endpoints/ocpp/1.6/configuration/ChangeConfigurationEndpoint.js';
import { GetConfigurationEndpoint } from '@modules/Api/src/module/endpoints/ocpp/1.6/configuration/GetConfigurationEndpoint.js';
import { SetDisplayMessageEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/configuration/SetDisplayMessageEndpoint.js';
import { TriggerMessageEndpoint as TriggerMessage16Endpoint } from '@modules/Api/src/module/endpoints/ocpp/1.6/configuration/TriggerMessageEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const STATION = 'cs001';
const OTHER_STATION = 'cs002';

describe('configuration message endpoints', () => {
  const { container } = createTestContainer();

  let sendCall: ReturnType<typeof vi.fn>;
  let readChargingStationByStationId: ReturnType<typeof vi.fn>;
  let findByStationAndKey: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
    readChargingStationByStationId = vi.fn().mockResolvedValue({ id: 1 });
    findByStationAndKey = vi.fn().mockResolvedValue(undefined);
  });

  describe('ChangeConfigurationEndpoint', () => {
    const request: OCPP1_6.ChangeConfigurationRequest = { key: 'HeartbeatInterval', value: '60' };

    const build = () =>
      getTestInstance(container, ChangeConfigurationEndpoint, {
        ocppSender: { sendCall },
        locationRepository: { readChargingStationByStationId },
      });

    it('is declared for OCPP 1.6 only', () => {
      expect(ChangeConfigurationEndpoint.route.protocols).toEqual([OCPPVersion.OCPP1_6]);
      expect(ChangeConfigurationEndpoint.route.action).toBe(OCPP_CallAction.ChangeConfiguration);
    });

    it('sends the request to a known station', async () => {
      const confirmations = await build().handle(
        [STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP1_6,
      );

      expect(confirmations).toEqual([{ success: true, payload: 'queued' }]);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        ocppConnectionName: STATION,
        protocol: OCPPVersion.OCPP1_6,
        action: OCPP_CallAction.ChangeConfiguration,
        eventGroup: EventGroup.Configuration,
        payload: request,
      });
    });

    it('refuses an unknown station without sending', async () => {
      readChargingStationByStationId.mockResolvedValue(undefined);

      const confirmations = await build().handle(
        [STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP1_6,
      );

      expect(confirmations).toEqual([
        { success: false, payload: `Charging station ${STATION} not found` },
      ]);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('reports per-station results when only one station is unknown', async () => {
      readChargingStationByStationId.mockImplementation(async (_tenantId, name) =>
        name === STATION ? { id: 1 } : undefined,
      );

      const confirmations = await build().handle(
        [STATION, OTHER_STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP1_6,
      );

      expect(confirmations).toEqual([
        { success: true, payload: 'queued' },
        { success: false, payload: `Charging station ${OTHER_STATION} not found` },
      ]);
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('forwards the callback url', async () => {
      await build().handle([STATION], request, 'http://cb', DEFAULT_TENANT_ID, OCPPVersion.OCPP1_6);

      expect(sendCall.mock.calls[0][0].callbackUrl).toBe('http://cb');
    });
  });

  describe('GetConfigurationEndpoint', () => {
    const build = () =>
      getTestInstance(container, GetConfigurationEndpoint, {
        ocppSender: { sendCall },
        locationRepository: { readChargingStationByStationId },
        changeConfigurationRepository: { findByStationAndKey },
      });

    const handle = (request: OCPP1_6.GetConfigurationRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP1_6);

    it('sends a single call when no keys are requested', async () => {
      const confirmations = await handle({});

      expect(sendCall).toHaveBeenCalledTimes(1);
      expect(sendCall.mock.calls[0][0].payload).toEqual({ key: [] });
      expect(confirmations).toHaveLength(1);
    });

    it('sends one call when the key count is within the station limit', async () => {
      findByStationAndKey.mockResolvedValue({ value: '5' });

      await handle({ key: ['a', 'b', 'c'] });

      expect(sendCall).toHaveBeenCalledTimes(1);
      expect(sendCall.mock.calls[0][0].payload).toEqual({ key: ['a', 'b', 'c'] });
    });

    it('splits keys into batches of GetConfigurationMaxKeys', async () => {
      findByStationAndKey.mockResolvedValue({ value: '2' });

      await handle({ key: ['a', 'b', 'c', 'd', 'e'] });

      expect(sendCall).toHaveBeenCalledTimes(3);
      expect(sendCall.mock.calls.map((call) => call[0].payload.key)).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e'],
      ]);
    });

    it('labels each confirmation with its batch range and station', async () => {
      findByStationAndKey.mockResolvedValue({ value: '2' });

      const confirmations = await handle({ key: ['a', 'b', 'c'] });

      expect(confirmations).toHaveLength(2);
      for (const confirmation of confirmations) {
        expect(confirmation.payload).toMatchObject({ ocppConnectionName: STATION });
      }
    });

    it('gives every batch its own correlation id', async () => {
      findByStationAndKey.mockResolvedValue({ value: '1' });

      await handle({ key: ['a', 'b'] });

      const ids = sendCall.mock.calls.map((call) => call[0].correlationId);
      expect(new Set(ids).size).toBe(2);
    });

    it('treats an absent max-keys configuration as unlimited', async () => {
      findByStationAndKey.mockResolvedValue(undefined);

      await handle({ key: ['a', 'b', 'c', 'd'] });

      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('captures a send failure as an unsuccessful batch instead of throwing', async () => {
      findByStationAndKey.mockResolvedValue({ value: '1' });
      sendCall.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({
        success: true,
        payload: 'queued',
      });

      const confirmations = await handle({ key: ['a', 'b'] });

      expect(confirmations).toHaveLength(2);
      expect(confirmations.some((confirmation) => confirmation.success === false)).toBe(true);
    });

    it('refuses an unknown station without sending', async () => {
      readChargingStationByStationId.mockResolvedValue(undefined);

      const confirmations = await handle({ key: ['a'] });

      expect(sendCall).not.toHaveBeenCalled();
      expect(confirmations[0].success).toBe(false);
    });
  });

  describe('SetDisplayMessageEndpoint', () => {
    const build = () =>
      getTestInstance(container, SetDisplayMessageEndpoint, { ocppSender: { sendCall } });

    const aRequest = (
      override: Partial<OCPP2_0_1.MessageInfoType> = {},
    ): OCPP2_0_1.SetDisplayMessageRequest => ({
      message: {
        id: 1,
        priority: OCPP2_0_1.MessagePriorityEnumType.NormalCycle,
        message: { format: OCPP2_0_1.MessageFormatEnumType.ASCII, content: 'hello' },
        ...override,
      },
    });

    it('is declared for both OCPP 2.x protocols', () => {
      expect(SetDisplayMessageEndpoint.route.protocols).toEqual([
        OCPPVersion.OCPP2_0_1,
        OCPPVersion.OCPP2_1,
      ]);
    });

    it('defaults startDateTime to now when omitted', async () => {
      const request = aRequest();

      await build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

      expect(request.message.startDateTime).toEqual(expect.any(String));
      expect(Number.isNaN(Date.parse(request.message.startDateTime!))).toBe(false);
    });

    it('keeps an explicit startDateTime', async () => {
      const startDateTime = '2030-01-01T00:00:00.000Z';

      await build().handle(
        [STATION],
        aRequest({ startDateTime }),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(sendCall.mock.calls[0][0].payload.message.startDateTime).toBe(startDateTime);
    });

    it('rejects a language tag that is not an RFC-5646 tag', async () => {
      const request = aRequest();
      request.message.message.language = 'not a tag';

      const confirmations = await build().handle(
        [STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(confirmations[0].success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('accepts a valid language tag', async () => {
      const request = aRequest();
      request.message.message.language = 'en-US';

      const confirmations = await build().handle(
        [STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(confirmations[0].success).toBe(true);
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('sends the requested version as the protocol', async () => {
      await build().handle(
        [STATION],
        aRequest(),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
      );

      expect(sendCall.mock.calls[0][0].protocol).toBe(OCPPVersion.OCPP2_1);
    });

    it('fans out to every identifier', async () => {
      await build().handle(
        [STATION, OTHER_STATION],
        aRequest(),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(sendCall.mock.calls.map((call) => call[0].ocppConnectionName)).toEqual([
        STATION,
        OTHER_STATION,
      ]);
    });
  });

  describe('TriggerMessage16Endpoint', () => {
    const build = () =>
      getTestInstance(container, TriggerMessage16Endpoint, { ocppSender: { sendCall } });

    const handle = (request: OCPP1_6.TriggerMessageRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP1_6);

    it('sends when connectorId is omitted', async () => {
      const confirmations = await handle({
        requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage.Heartbeat,
      });

      expect(confirmations[0].success).toBe(true);
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('sends when connectorId is positive', async () => {
      await handle({
        requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage.Heartbeat,
        connectorId: 1,
      });

      expect(sendCall.mock.calls[0][0].payload.connectorId).toBe(1);
    });

    it('rejects a connectorId of zero without sending', async () => {
      const confirmations = await handle({
        requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage.Heartbeat,
        connectorId: 0,
      });

      expect(confirmations[0].success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('rejects a negative connectorId without sending', async () => {
      const confirmations = await handle({
        requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage.Heartbeat,
        connectorId: -1,
      });

      expect(confirmations[0].success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });
  });
});
