// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  ChargingLimitSourceEnum,
  ChargingProfileStatusEnum,
  type ChargingProfileStatusEnumType,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  type OCPP2_response_types,
} from '@citrineos/types';
import { SetChargingProfileResponseOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';

function makeMessage(
  status: ChargingProfileStatusEnumType,
): IMessage<OCPP2_response_types.SetChargingProfileResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload: { status },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.SmartCharging,
    action: OCPP_CallAction.SetChargingProfile,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OCPP2_response_types.SetChargingProfileResponse>;
}

describe('SetChargingProfileResponseOcpp2Handler', () => {
  const { container } = createTestContainer();
  let sendCall: ReturnType<typeof vi.fn>;
  let updateAllByQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendCall = vi.fn().mockResolvedValue({ success: true });
    updateAllByQuery = vi.fn().mockResolvedValue([]);
  });

  const handle = (status: ChargingProfileStatusEnumType) =>
    getTestInstance(container, SetChargingProfileResponseOcpp2Handler, {
      ocppSender: { sendCall },
      chargingProfileRepository: { updateAllByQuery },
      idGenerator: { generateRequestId: vi.fn().mockResolvedValue(1) },
    }).handle(makeMessage(status));

  const expectCsoProfilesReRead = () => {
    expect(sendCall).toHaveBeenCalledOnce();
    expect(sendCall.mock.calls[0][0]).toMatchObject({
      ocppConnectionName: STATION,
      action: OCPP_CallAction.GetChargingProfiles,
      payload: { chargingProfile: { chargingLimitSource: [ChargingLimitSourceEnum.CSO] } },
    });
  };

  it('deactivates the stored CSO profiles and re-reads them when the station accepts', async () => {
    await handle(ChargingProfileStatusEnum.Accepted);

    expect(updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: false },
      expect.objectContaining({
        where: expect.objectContaining({ chargingLimitSource: ChargingLimitSourceEnum.CSO }),
      }),
    );
    expectCsoProfilesReRead();
  });

  it('re-reads the CSO profiles from the station when it rejects the profile', async () => {
    await handle(ChargingProfileStatusEnum.Rejected);

    expectCsoProfilesReRead();
  });

  it('leaves the stored profiles active when the station rejects the profile', async () => {
    await handle(ChargingProfileStatusEnum.Rejected);

    expect(updateAllByQuery).not.toHaveBeenCalled();
  });
});
