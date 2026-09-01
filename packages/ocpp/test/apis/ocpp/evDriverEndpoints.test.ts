// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CancelReservationEndpoint } from '@/apis/ocpp/2/evDriver/CancelReservationEndpoint.js';
import { RequestStartTransactionEndpoint } from '@/apis/ocpp/2/evDriver/RequestStartTransactionEndpoint.js';
import { ReserveNowEndpoint } from '@/apis/ocpp/2/evDriver/ReserveNowEndpoint.js';
import { SendLocalListEndpoint as SendLocalList16Endpoint } from '@/apis/ocpp/1.6/evDriver/SendLocalListEndpoint.js';
import { SendLocalListEndpoint } from '@/apis/ocpp/2/evDriver/SendLocalListEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const STATION = 'cs001';
const OTHER_STATION = 'cs002';

describe('evDriver message endpoints', () => {
  const { container } = createTestContainer();

  let sendCall: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
  });

  describe('CancelReservationEndpoint', () => {
    let readOnlyOneByQuery: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      readOnlyOneByQuery = vi.fn().mockResolvedValue({ id: 7 });
    });

    const build = () =>
      getTestInstance(container, CancelReservationEndpoint, {
        ocppSender: { sendCall },
        reservationRepository: { readOnlyOneByQuery },
      });

    const handle = (identifiers: string[]) =>
      build().handle(
        identifiers,
        { reservationId: 7 },
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

    it('sends once the reservation is confirmed to exist', async () => {
      const confirmations = await handle([STATION]);

      expect(confirmations).toEqual([{ success: true, payload: 'queued' }]);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.CancelReservation,
        eventGroup: EventGroup.EVDriver,
      });
    });

    it('looks the reservation up per station and tenant', async () => {
      await handle([STATION]);

      expect(readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
        where: { id: 7, ocppConnectionName: STATION, tenantId: DEFAULT_TENANT_ID },
      });
    });

    it('sends to nobody when the reservation is missing on any station', async () => {
      readOnlyOneByQuery.mockImplementation(async (_tenantId, query) =>
        query.where.ocppConnectionName === STATION ? { id: 7 } : undefined,
      );

      const confirmations = await handle([STATION, OTHER_STATION]);

      expect(sendCall).not.toHaveBeenCalled();
      expect(confirmations).toHaveLength(2);
      expect(confirmations.every((confirmation) => !confirmation.success)).toBe(true);
      expect(String(confirmations[0].payload)).toContain(OTHER_STATION);
    });

    it('returns one failure per identifier when the lookup throws', async () => {
      readOnlyOneByQuery.mockRejectedValue(new Error('db down'));

      const confirmations = await handle([STATION, OTHER_STATION]);

      expect(confirmations).toEqual([
        { success: false, payload: 'db down' },
        { success: false, payload: 'db down' },
      ]);
    });
  });

  describe('ReserveNowEndpoint', () => {
    let createOrUpdateReservation: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createOrUpdateReservation = vi.fn().mockResolvedValue({ id: 7 });
    });

    const build = () =>
      getTestInstance(container, ReserveNowEndpoint, {
        ocppSender: { sendCall },
        reservationRepository: { createOrUpdateReservation },
      });

    const request: OCPP2_0_1.ReserveNowRequest = {
      id: 7,
      expiryDateTime: '2030-01-01T00:00:00.000Z',
      idToken: { idToken: 'tok', type: OCPP2_0_1.IdTokenEnumType.Central },
    };

    const handle = (identifiers: string[]) =>
      build().handle(identifiers, request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('stores the reservation before sending', async () => {
      await handle([STATION]);

      expect(createOrUpdateReservation).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        request,
        STATION,
        false,
      );
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('does not send when the reservation could not be stored', async () => {
      createOrUpdateReservation.mockResolvedValue(undefined);

      const confirmations = await handle([STATION]);

      expect(sendCall).not.toHaveBeenCalled();
      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain(STATION);
    });

    it('keeps going for the remaining stations after one fails to store', async () => {
      createOrUpdateReservation.mockImplementation(async (_tenantId, _request, name) =>
        name === STATION ? undefined : { id: 7 },
      );

      const confirmations = await handle([STATION, OTHER_STATION]);

      expect(confirmations).toHaveLength(2);
      expect(confirmations[0].success).toBe(false);
      expect(confirmations[1].success).toBe(true);
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('captures a store failure as an unsuccessful confirmation', async () => {
      createOrUpdateReservation.mockRejectedValue(new Error('db down'));

      const confirmations = await handle([STATION]);

      expect(confirmations).toEqual([{ success: false, payload: 'db down' }]);
    });
  });

  describe('SendLocalList16Endpoint', () => {
    let prepareSendLocalList16: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      prepareSendLocalList16 = vi.fn().mockResolvedValue('correlation-1');
    });

    const build = () =>
      getTestInstance(container, SendLocalList16Endpoint, {
        ocppSender: { sendCall },
        localAuthListService: { prepareSendLocalList16 },
      });

    const request: OCPP1_6.SendLocalListRequest = {
      listVersion: 2,
      updateType: OCPP1_6.SendLocalListRequestUpdateType.Full,
    };

    it('is declared for OCPP 1.6 only', () => {
      expect(SendLocalList16Endpoint.route.protocols).toEqual([OCPPVersion.OCPP1_6]);
    });

    it('threads the correlation id the service returned into the send', async () => {
      await build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP1_6);

      expect(prepareSendLocalList16).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION, request);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        correlationId: 'correlation-1',
        protocol: OCPPVersion.OCPP1_6,
      });
    });

    it('captures a preparation failure per station', async () => {
      prepareSendLocalList16.mockRejectedValue(new Error('bad list'));

      const confirmations = await build().handle(
        [STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP1_6,
      );

      expect(confirmations).toEqual([{ success: false, payload: 'bad list' }]);
      expect(sendCall).not.toHaveBeenCalled();
    });
  });

  describe('SendLocalListEndpoint', () => {
    let prepareSendLocalList: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      prepareSendLocalList = vi.fn().mockResolvedValue('correlation-2');
    });

    const build = () =>
      getTestInstance(container, SendLocalListEndpoint, {
        ocppSender: { sendCall },
        localAuthListService: { prepareSendLocalList },
      });

    const request: OCPP2_0_1.SendLocalListRequest = {
      versionNumber: 3,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    it('threads the correlation id and the requested version', async () => {
      await build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_1);

      expect(prepareSendLocalList).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION, request);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        correlationId: 'correlation-2',
        protocol: OCPPVersion.OCPP2_1,
      });
    });

    it('processes each station independently', async () => {
      prepareSendLocalList.mockImplementation(async (_tenantId, name) => {
        if (name === STATION) {
          throw new Error('bad list');
        }
        return 'correlation-2';
      });

      const confirmations = await build().handle(
        [STATION, OTHER_STATION],
        request,
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_0_1,
      );

      expect(confirmations[0]).toEqual({ success: false, payload: 'bad list' });
      expect(confirmations[1].success).toBe(true);
    });
  });

  describe('RequestStartTransactionEndpoint', () => {
    let cacheSet: ReturnType<typeof vi.fn>;
    let readAllByQuerystring: ReturnType<typeof vi.fn>;
    let createOrUpdateChargingProfile: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      cacheSet = vi.fn().mockResolvedValue(undefined);
      readAllByQuerystring = vi.fn().mockResolvedValue([]);
      createOrUpdateChargingProfile = vi.fn().mockResolvedValue({ id: 1 });
    });

    const build = () =>
      getTestInstance(container, RequestStartTransactionEndpoint, {
        ocppSender: { sendCall },
        cache: { set: cacheSet },
        deviceModelRepository: { readAllByQuerystring },
        chargingProfileRepository: { createOrUpdateChargingProfile },
        transactionEventRepository: {},
      });

    const aRequest = (
      override: Partial<OCPP2_0_1.RequestStartTransactionRequest> = {},
    ): OCPP2_0_1.RequestStartTransactionRequest => ({
      remoteStartId: 1,
      idToken: { idToken: 'tok', type: OCPP2_0_1.IdTokenEnumType.Central },
      ...override,
    });

    const handle = (
      request: OCPP2_0_1.RequestStartTransactionRequest,
      version: OCPPVersion = OCPPVersion.OCPP2_0_1,
    ) => build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, version);

    it('sends straight through when no charging profile is supplied', async () => {
      const confirmations = await handle(aRequest());

      expect(confirmations).toEqual([{ success: true, payload: 'queued' }]);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.RequestStartTransaction,
        eventGroup: EventGroup.EVDriver,
      });
      expect(createOrUpdateChargingProfile).not.toHaveBeenCalled();
    });

    it('refuses a charging profile whose purpose is not TxProfile', async () => {
      const confirmations = await handle(
        aRequest({
          chargingProfile: {
            id: 1,
            stackLevel: 0,
            chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxDefaultProfile,
            chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType.Absolute,
            chargingSchedule: [],
          },
        }),
      );

      expect(confirmations[0]).toEqual({
        success: false,
        payload: 'The Purpose of the ChargingProfile SHALL always be TxProfile.',
      });
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('caches a 2.1 transaction limit before sending', async () => {
      await handle(
        aRequest({ customData: { vendorId: 'citrineos', transactionLimit: { maxCost: 10 } } }),
        OCPPVersion.OCPP2_1,
      );

      expect(cacheSet).toHaveBeenCalled();
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('ignores a transaction limit on 2.0.1, where it is not part of the protocol', async () => {
      await handle(
        aRequest({ customData: { vendorId: 'citrineos', transactionLimit: { maxCost: 10 } } }),
        OCPPVersion.OCPP2_0_1,
      );

      expect(cacheSet).not.toHaveBeenCalled();
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('captures a send failure as an unsuccessful confirmation', async () => {
      sendCall.mockRejectedValue(new Error('offline'));

      const confirmations = await handle(aRequest());

      expect(confirmations).toEqual([{ success: false, payload: 'offline' }]);
    });
  });
});
