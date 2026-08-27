// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClearChargingProfileEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/smartCharging/ClearChargingProfileEndpoint.js';
import { GetChargingProfilesEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/smartCharging/GetChargingProfilesEndpoint.js';
import { GetCompositeScheduleEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/smartCharging/GetCompositeScheduleEndpoint.js';
import { SetChargingProfileEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/smartCharging/SetChargingProfileEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const STATION = 'cs001';

describe('smartCharging message endpoints', () => {
  const { container } = createTestContainer();

  let sendCall: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
  });

  describe('ClearChargingProfileEndpoint', () => {
    const build = () =>
      getTestInstance(container, ClearChargingProfileEndpoint, { ocppSender: { sendCall } });

    const handle = (request: OCPP2_0_1.ClearChargingProfileRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends when only a chargingProfileId is given', async () => {
      const confirmations = await handle({ chargingProfileId: 1 });

      expect(confirmations).toEqual([{ success: true, payload: 'queued' }]);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.ClearChargingProfile,
        eventGroup: EventGroup.SmartCharging,
      });
    });

    it('sends when criteria alone narrow the request', async () => {
      const confirmations = await handle({ chargingProfileCriteria: { evseId: 1 } });

      expect(confirmations[0].success).toBe(true);
    });

    it('refuses a request with neither an id nor criteria', async () => {
      const confirmations = await handle({});

      expect(confirmations[0]).toEqual({
        success: false,
        payload: 'Either chargingProfileId or chargingProfileCriteria must be provided',
      });
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('refuses empty criteria when no id is given', async () => {
      const confirmations = await handle({ chargingProfileCriteria: {} });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('At least one of');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('refuses criteria alongside an id as redundant', async () => {
      const confirmations = await handle({
        chargingProfileId: 1,
        chargingProfileCriteria: { evseId: 1 },
      });

      expect(confirmations[0]).toEqual({
        success: false,
        payload: 'chargingProfileCriteria is not needed when chargingProfileId is provided.',
      });
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('refuses the ChargingStationExternalConstraints purpose, which the CSMS may not set', async () => {
      const confirmations = await handle({
        chargingProfileCriteria: {
          chargingProfilePurpose:
            OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationExternalConstraints,
        },
      });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('SHALL NOT');
      expect(sendCall).not.toHaveBeenCalled();
    });
  });

  describe('GetChargingProfilesEndpoint', () => {
    let findVariableCharacteristics: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      findVariableCharacteristics = vi.fn().mockResolvedValue(undefined);
    });

    const build = () =>
      getTestInstance(container, GetChargingProfilesEndpoint, {
        ocppSender: { sendCall },
        deviceModelRepository: {
          findVariableCharacteristicsByVariableNameAndVariableInstance: findVariableCharacteristics,
        },
      });

    const handle = (request: OCPP2_0_1.GetChargingProfilesRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends when queried by profile id alone', async () => {
      const confirmations = await handle({
        requestId: 1,
        chargingProfile: { chargingProfileId: [1] },
      });

      expect(confirmations[0].success).toBe(true);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.GetChargingProfiles,
        eventGroup: EventGroup.SmartCharging,
      });
    });

    it('sends when queried by a single criterion', async () => {
      const confirmations = await handle({
        requestId: 1,
        chargingProfile: { stackLevel: 1 },
      });

      expect(confirmations[0].success).toBe(true);
    });

    it('refuses mixing profile ids with other criteria', async () => {
      const confirmations = await handle({
        requestId: 1,
        chargingProfile: { chargingProfileId: [1], stackLevel: 1 },
      });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('are not needed when chargingProfileId');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('refuses a query with no criteria at all', async () => {
      const confirmations = await handle({ requestId: 1, chargingProfile: {} });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('At least one of');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('refuses more profile ids than the station advertises it can hold', async () => {
      findVariableCharacteristics.mockResolvedValue({ maxLimit: 1 });

      const confirmations = await handle({
        requestId: 1,
        chargingProfile: { chargingProfileId: [1, 2] },
      });

      expect(confirmations[0].success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('sends when the profile id count is within the station limit', async () => {
      findVariableCharacteristics.mockResolvedValue({ maxLimit: 5 });

      const confirmations = await handle({
        requestId: 1,
        chargingProfile: { chargingProfileId: [1, 2] },
      });

      expect(confirmations[0].success).toBe(true);
    });
  });

  describe('GetCompositeScheduleEndpoint', () => {
    let findEvseByIdAndConnectorId: ReturnType<typeof vi.fn>;
    let findVariableCharacteristics: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      findEvseByIdAndConnectorId = vi.fn().mockResolvedValue({ id: 1 });
      findVariableCharacteristics = vi.fn().mockResolvedValue(undefined);
    });

    const build = () =>
      getTestInstance(container, GetCompositeScheduleEndpoint, {
        ocppSender: { sendCall },
        deviceModelRepository: {
          findEvseByIdAndConnectorId,
          findVariableCharacteristicsByVariableNameAndVariableInstance: findVariableCharacteristics,
        },
      });

    const handle = (request: OCPP2_0_1.GetCompositeScheduleRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends for the whole station when evseId is 0, without an EVSE lookup', async () => {
      const confirmations = await handle({ duration: 60, evseId: 0 });

      expect(findEvseByIdAndConnectorId).not.toHaveBeenCalled();
      expect(confirmations[0].success).toBe(true);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.GetCompositeSchedule,
        eventGroup: EventGroup.SmartCharging,
      });
    });

    it('looks up a non-zero EVSE before sending', async () => {
      const confirmations = await handle({ duration: 60, evseId: 2 });

      expect(findEvseByIdAndConnectorId).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 2, null);
      expect(confirmations[0].success).toBe(true);
    });

    it('refuses an unknown EVSE without sending', async () => {
      findEvseByIdAndConnectorId.mockResolvedValue(undefined);

      const confirmations = await handle({ duration: 60, evseId: 2 });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('EVSE 2 not found');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('sends when the station declares no supported rate unit member list', async () => {
      const confirmations = await handle({
        duration: 60,
        evseId: 0,
        chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType.W,
      });

      expect(confirmations[0].success).toBe(true);
    });

    it('sends a rate unit the station lists as supported', async () => {
      findVariableCharacteristics.mockResolvedValue({
        dataType: OCPP2_0_1.DataEnumType.MemberList,
        valuesList: 'W,A',
      });

      const confirmations = await handle({
        duration: 60,
        evseId: 0,
        chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType.W,
      });

      expect(confirmations[0].success).toBe(true);
    });

    it('refuses a rate unit outside the station member list', async () => {
      findVariableCharacteristics.mockResolvedValue({
        dataType: OCPP2_0_1.DataEnumType.MemberList,
        valuesList: 'A',
      });

      const confirmations = await handle({
        duration: 60,
        evseId: 0,
        chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType.W,
      });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('chargingRateUnit SHALL be one of');
      expect(sendCall).not.toHaveBeenCalled();
    });
  });
  describe('SetChargingProfileEndpoint', () => {
    let readAllByQuerystring: ReturnType<typeof vi.fn>;
    let createOrUpdateChargingProfile: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      readAllByQuerystring = vi.fn().mockResolvedValue([]);
      createOrUpdateChargingProfile = vi.fn().mockResolvedValue({ id: 1 });
    });

    const build = () =>
      getTestInstance(container, SetChargingProfileEndpoint, {
        ocppSender: { sendCall },
        deviceModelRepository: {
          readAllByQuerystring,
          // No RateUnit characteristics stored, so the member-list check is skipped.
          findVariableCharacteristicsByVariableNameAndVariableInstance: vi
            .fn()
            .mockResolvedValue(undefined),
        },
        chargingProfileRepository: {
          createOrUpdateChargingProfile,
          readAllByQuery: vi.fn().mockResolvedValue([]),
          existByQuery: vi.fn().mockResolvedValue(0),
        },
        transactionEventRepository: {},
      });

    const aProfile = (override: Record<string, unknown> = {}) => ({
      evseId: 0,
      chargingProfile: {
        id: 1,
        stackLevel: 0,
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationMaxProfile,
        chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType.Absolute,
        chargingSchedule: [],
        ...override,
      },
    });

    const handle = (request: ReturnType<typeof aProfile>) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('reports a validation failure as an unsuccessful confirmation without sending', async () => {
      const confirmations = await handle(aProfile({ stackLevel: -1 }));

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('Lowest Stack level is 0');
      expect(sendCall).not.toHaveBeenCalled();
      expect(createOrUpdateChargingProfile).not.toHaveBeenCalled();
    });

    it('refuses a profile whose validFrom is in the future', async () => {
      const validFrom = new Date(Date.now() + 60_000).toISOString();

      const confirmations = await handle(aProfile({ validFrom }));

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('should not be in the future');
      expect(sendCall).not.toHaveBeenCalled();
    });

    /** A schedule whose single period asks the station to charge on one specific phase. */
    const aPhaseToUseSchedule = () => ({
      chargingSchedule: [
        {
          id: 1,
          // Absolute is the kind aProfile() uses, so a startSchedule is required.
          startSchedule: new Date().toISOString(),
          chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType.A,
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16, numberPhases: 1, phaseToUse: 1 }],
        },
      ],
    });

    /** Mocks the device model so ACPhaseSwitchingSupported reports the given value. */
    const withPhaseSwitching = (value: string | undefined) => {
      readAllByQuerystring.mockImplementation(async (_tenantId: number, query: any) =>
        query.variable_name === 'ACPhaseSwitchingSupported' && value !== undefined
          ? [{ value }]
          : [],
      );
    };

    it('refuses phaseToUse when the station reports AC phase switching unsupported', async () => {
      // The guard tested only whether the variable row existed, not what it said. A station that
      // explicitly reports ACPhaseSwitchingSupported=false has a row, so the profile was accepted
      // and forwarded to hardware that cannot honour it.
      withPhaseSwitching('false');

      const confirmations = await handle(aProfile(aPhaseToUseSchedule()));

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('phaseToUse not allowed');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('refuses phaseToUse when the station does not report the variable at all', async () => {
      withPhaseSwitching(undefined);

      const confirmations = await handle(aProfile(aPhaseToUseSchedule()));

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('phaseToUse not allowed');
    });

    it('allows phaseToUse when the station reports AC phase switching supported', async () => {
      withPhaseSwitching('true');

      const confirmations = await handle(aProfile(aPhaseToUseSchedule()));

      expect(confirmations[0].success).not.toBe(false);
      expect(sendCall).toHaveBeenCalled();
    });

    it('refuses a profile that has already expired', async () => {
      const validTo = new Date(Date.now() - 60_000).toISOString();

      const confirmations = await handle(aProfile({ validTo }));

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('should be in the future');
      expect(sendCall).not.toHaveBeenCalled();
    });
  });
});
