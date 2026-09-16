// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  ChargingLimitSourceEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IChangeConfigurationRepository,
  IChargingProfileRepository,
  ILocalAuthListRepository,
  IOCPPMessageRepository,
} from '@citrineos/dal';
import {
  ChangeConfigurationResponseOcpp16Handler,
  ClearChargingProfileResponseOcpp16Handler,
  GetConfigurationResponseOcpp16Handler,
  RemoteStartTransactionResponseOcpp16Handler,
  SendLocalListResponseOcpp16Handler,
  SetChargingProfileResponseOcpp16Handler,
} from '@handlers/index.js';
import {
  createTestContainer,
  getTestInstance,
  makeMockOcppSender,
  type MockOcppSender,
} from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION_ID = 'corr-001';

function makeMessage<T extends OcppResponse>(action: OCPP_CallAction, payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

// CSMS-originated request row as the IOCPPMessageRepository returns it.
function requestRow(payload: unknown) {
  return { payload } as never;
}

describe('SendLocalListResponseOcpp16Handler', () => {
  const originalRequest = { listVersion: 5, updateType: 'Full' };
  let handler: SendLocalListResponseOcpp16Handler;
  let localAuthListRepository: Mocked<ILocalAuthListRepository>;
  let ocppSender: MockOcppSender;

  beforeEach(() => {
    const { container } = createTestContainer();
    localAuthListRepository = {
      getSendLocalListRequestByStationIdAndCorrelationId: vi
        .fn()
        .mockResolvedValue(originalRequest),
      createOrUpdateLocalListVersionFromStationIdAndSendLocalList: vi.fn().mockResolvedValue({}),
    } as unknown as Mocked<ILocalAuthListRepository>;
    ocppSender = makeMockOcppSender();
    handler = getTestInstance(container, SendLocalListResponseOcpp16Handler, {
      ocppSender,
      localAuthListRepository,
    });
  });

  function respond(status: OCPP1_6.SendLocalListResponseStatus) {
    return handler.handle(makeMessage(OCPP_CallAction.SendLocalList, { status }));
  }

  it('Accepted stores the list version from the correlated request', async () => {
    await respond(OCPP1_6.SendLocalListResponseStatus.Accepted);

    expect(
      localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION, CORRELATION_ID);
    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).toHaveBeenCalledTimes(1);
    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION, originalRequest);
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('Failed writes nothing and sends nothing', async () => {
    await respond(OCPP1_6.SendLocalListResponseStatus.Failed);

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('NotSupported writes nothing and sends nothing', async () => {
    await respond(OCPP1_6.SendLocalListResponseStatus.NotSupported);

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('VersionMismatch fires GetLocalListVersion at the same station instead of writing', async () => {
    await respond(OCPP1_6.SendLocalListResponseStatus.VersionMismatch);

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP1_6,
      action: OCPP_CallAction.GetLocalListVersion,
      eventGroup: EventGroup.EVDriver,
      payload: {},
    });
  });

  it('VersionMismatch resolves even when the resync call is refused', async () => {
    ocppSender.sendCall.mockResolvedValue({ success: false });

    await expect(respond(OCPP1_6.SendLocalListResponseStatus.VersionMismatch)).resolves.toBe(
      undefined,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
  });

  it('missing correlated request aborts before any write or send', async () => {
    localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId.mockResolvedValue(
      undefined as never,
    );

    await respond(OCPP1_6.SendLocalListResponseStatus.Accepted);

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });
});

describe('ChangeConfigurationResponseOcpp16Handler', () => {
  let handler: ChangeConfigurationResponseOcpp16Handler;
  let changeConfigurationRepository: Mocked<IChangeConfigurationRepository>;
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;

  beforeEach(() => {
    const { container } = createTestContainer();
    changeConfigurationRepository = {
      createOrUpdateChangeConfiguration: vi.fn().mockResolvedValue({ key: 'HeartbeatInterval' }),
    } as unknown as Mocked<IChangeConfigurationRepository>;
    ocppMessageRepository = {
      readOnlyOneByQuery: vi
        .fn()
        .mockResolvedValue(requestRow({ key: 'HeartbeatInterval', value: '300' })),
    } as unknown as Mocked<IOCPPMessageRepository>;
    handler = getTestInstance(container, ChangeConfigurationResponseOcpp16Handler, {
      changeConfigurationRepository,
      ocppMessageRepository,
    });
  });

  function respond(status: OCPP1_6.ChangeConfigurationResponseStatus) {
    return handler.handle(makeMessage(OCPP_CallAction.ChangeConfiguration, { status }));
  }

  it('Accepted persists the key and value from the correlated CSMS request', async () => {
    await respond(OCPP1_6.ChangeConfigurationResponseStatus.Accepted);

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        ocppConnectionName: STATION,
        correlationId: CORRELATION_ID,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledTimes(
      1,
    );
    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION,
        key: 'HeartbeatInterval',
        value: '300',
      },
    );
  });

  it('RebootRequired still persists the pending value', async () => {
    await respond(OCPP1_6.ChangeConfigurationResponseStatus.RebootRequired);

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      expect.objectContaining({ key: 'HeartbeatInterval', value: '300' }),
    );
  });

  it('Rejected persists nothing', async () => {
    await respond(OCPP1_6.ChangeConfigurationResponseStatus.Rejected);

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).not.toHaveBeenCalled();
  });

  it('NotSupported persists nothing', async () => {
    await respond(OCPP1_6.ChangeConfigurationResponseStatus.NotSupported);

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).not.toHaveBeenCalled();
  });

  it('resolves when the repository reports the upsert failed', async () => {
    changeConfigurationRepository.createOrUpdateChangeConfiguration.mockResolvedValue(undefined);

    await expect(respond(OCPP1_6.ChangeConfigurationResponseStatus.Accepted)).resolves.toBe(
      undefined,
    );
    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledTimes(
      1,
    );
  });
});

describe('RemoteStartTransactionResponseOcpp16Handler', () => {
  const remoteStartRequest = {
    idTag: 'TAG-1',
    connectorId: 2,
    chargingProfile: {
      chargingProfileId: 42,
      stackLevel: 3,
      chargingProfilePurpose: 'TxProfile',
      chargingProfileKind: 'Absolute',
      chargingSchedule: {
        chargingRateUnit: 'A',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        duration: 3600,
      },
    },
  };
  let handler: RemoteStartTransactionResponseOcpp16Handler;
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;

  function build(originalRequest: unknown) {
    const { container } = createTestContainer();
    chargingProfileRepository = {
      createOrUpdateChargingProfile: vi.fn().mockResolvedValue({}),
    } as unknown as Mocked<IChargingProfileRepository>;
    ocppMessageRepository = {
      readOnlyOneByQuery: vi
        .fn()
        .mockResolvedValue(originalRequest === undefined ? undefined : requestRow(originalRequest)),
    } as unknown as Mocked<IOCPPMessageRepository>;
    handler = getTestInstance(container, RemoteStartTransactionResponseOcpp16Handler, {
      chargingProfileRepository,
      ocppMessageRepository,
    });
  }

  function respond(status: OCPP1_6.RemoteStartTransactionResponseStatus) {
    return handler.handle(makeMessage(OCPP_CallAction.RemoteStartTransaction, { status }));
  }

  it('Accepted stores the mapped profile as active CSO on the request connector', async () => {
    build(remoteStartRequest);

    await respond(OCPP1_6.RemoteStartTransactionResponseStatus.Accepted);

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION,
        correlationId: CORRELATION_ID,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      expect.objectContaining({
        id: 42,
        stackLevel: 3,
        chargingProfilePurpose: 'TxProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: [
          expect.objectContaining({
            id: 42,
            chargingRateUnit: 'A',
            duration: 3600,
            chargingSchedulePeriod: [expect.objectContaining({ startPeriod: 0, limit: 16 })],
          }),
        ],
      }),
      STATION,
      2,
      ChargingLimitSourceEnum.CSO,
      true,
    );
  });

  it('Accepted without connectorId stores the profile under null', async () => {
    build({ ...remoteStartRequest, connectorId: undefined });

    await respond(OCPP1_6.RemoteStartTransactionResponseStatus.Accepted);

    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      expect.objectContaining({ id: 42 }),
      STATION,
      null,
      ChargingLimitSourceEnum.CSO,
      true,
    );
  });

  it('Accepted without a charging profile stores nothing', async () => {
    build({ idTag: 'TAG-1', connectorId: 2 });

    await respond(OCPP1_6.RemoteStartTransactionResponseStatus.Accepted);

    expect(chargingProfileRepository.createOrUpdateChargingProfile).not.toHaveBeenCalled();
  });

  it('Accepted with no correlated request stores nothing', async () => {
    build(undefined);

    await respond(OCPP1_6.RemoteStartTransactionResponseStatus.Accepted);

    expect(chargingProfileRepository.createOrUpdateChargingProfile).not.toHaveBeenCalled();
  });

  it('Rejected skips the request lookup entirely', async () => {
    build(remoteStartRequest);

    await respond(OCPP1_6.RemoteStartTransactionResponseStatus.Rejected);

    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
    expect(chargingProfileRepository.createOrUpdateChargingProfile).not.toHaveBeenCalled();
  });
});

describe('SetChargingProfileResponseOcpp16Handler', () => {
  const setChargingProfileRequest = {
    connectorId: 1,
    csChargingProfiles: {
      chargingProfileId: 7,
      stackLevel: 0,
      chargingProfilePurpose: 'ChargePointMaxProfile',
      chargingProfileKind: 'Recurring',
      recurrencyKind: 'Daily',
      chargingSchedule: {
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [{ startPeriod: 0, limit: 11000, numberPhases: 3 }],
      },
    },
  };
  let handler: SetChargingProfileResponseOcpp16Handler;
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;

  function build(originalRequest: unknown) {
    const { container } = createTestContainer();
    chargingProfileRepository = {
      createOrUpdateChargingProfile: vi.fn().mockResolvedValue({}),
    } as unknown as Mocked<IChargingProfileRepository>;
    ocppMessageRepository = {
      readOnlyOneByQuery: vi
        .fn()
        .mockResolvedValue(originalRequest === undefined ? undefined : requestRow(originalRequest)),
    } as unknown as Mocked<IOCPPMessageRepository>;
    handler = getTestInstance(container, SetChargingProfileResponseOcpp16Handler, {
      chargingProfileRepository,
      ocppMessageRepository,
    });
  }

  function respond(status: OCPP1_6.SetChargingProfileResponseStatus) {
    return handler.handle(makeMessage(OCPP_CallAction.SetChargingProfile, { status }));
  }

  it('Accepted stores the mapped profile, translating ChargePointMaxProfile', async () => {
    build(setChargingProfileRequest);

    await respond(OCPP1_6.SetChargingProfileResponseStatus.Accepted);

    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.createOrUpdateChargingProfile).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      expect.objectContaining({
        id: 7,
        stackLevel: 0,
        // OCPP 1.6 'ChargePointMaxProfile' maps to the native name.
        chargingProfilePurpose: 'ChargingStationMaxProfile',
        chargingProfileKind: 'Recurring',
        recurrencyKind: 'Daily',
        chargingSchedule: [
          expect.objectContaining({
            id: 7,
            chargingRateUnit: 'W',
            chargingSchedulePeriod: [
              expect.objectContaining({ startPeriod: 0, limit: 11000, numberPhases: 3 }),
            ],
          }),
        ],
      }),
      STATION,
      1,
      ChargingLimitSourceEnum.CSO,
      true,
    );
  });

  it('Accepted with no correlated request stores nothing', async () => {
    build(undefined);

    await respond(OCPP1_6.SetChargingProfileResponseStatus.Accepted);

    expect(chargingProfileRepository.createOrUpdateChargingProfile).not.toHaveBeenCalled();
  });

  it('NotSupported skips the request lookup entirely', async () => {
    build(setChargingProfileRequest);

    await respond(OCPP1_6.SetChargingProfileResponseStatus.NotSupported);

    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
    expect(chargingProfileRepository.createOrUpdateChargingProfile).not.toHaveBeenCalled();
  });
});

describe('ClearChargingProfileResponseOcpp16Handler', () => {
  let handler: ClearChargingProfileResponseOcpp16Handler;
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;

  beforeEach(() => {
    const { container } = createTestContainer();
    chargingProfileRepository = {
      updateAllByQuery: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IChargingProfileRepository>;
    handler = getTestInstance(container, ClearChargingProfileResponseOcpp16Handler, {
      chargingProfileRepository,
    });
  });

  function respond(status: OCPP1_6.ClearChargingProfileResponseStatus) {
    return handler.handle(makeMessage(OCPP_CallAction.ClearChargingProfile, { status }));
  }

  it('Accepted deactivates only the station-scoped active profiles', async () => {
    await respond(OCPP1_6.ClearChargingProfileResponseStatus.Accepted);

    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: false },
      {
        where: {
          tenantId: DEFAULT_TENANT_ID,
          ocppConnectionName: STATION,
          isActive: true,
        },
        returning: false,
      },
    );
  });

  it('Unknown leaves profiles untouched', async () => {
    await respond(OCPP1_6.ClearChargingProfileResponseStatus.Unknown);

    expect(chargingProfileRepository.updateAllByQuery).not.toHaveBeenCalled();
  });
});

describe('GetConfigurationResponseOcpp16Handler', () => {
  let handler: GetConfigurationResponseOcpp16Handler;
  let changeConfigurationRepository: Mocked<IChangeConfigurationRepository>;

  beforeEach(() => {
    const { container } = createTestContainer();
    changeConfigurationRepository = {
      createOrUpdateChangeConfiguration: vi.fn().mockResolvedValue({}),
    } as unknown as Mocked<IChangeConfigurationRepository>;
    handler = getTestInstance(container, GetConfigurationResponseOcpp16Handler, {
      changeConfigurationRepository,
    });
  });

  function respond(payload: OCPP1_6.GetConfigurationResponse) {
    return handler.handle(makeMessage(OCPP_CallAction.GetConfiguration, payload));
  }

  it('writes one row per reported configuration key', async () => {
    await respond({
      configurationKey: [
        { key: 'HeartbeatInterval', readonly: false, value: '300' },
        { key: 'NumberOfConnectors', readonly: true, value: '2' },
      ],
    });

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledTimes(
      2,
    );
    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenNthCalledWith(
      1,
      DEFAULT_TENANT_ID,
      {
        ocppConnectionName: STATION,
        key: 'HeartbeatInterval',
        value: '300',
        readonly: false,
      },
    );
    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenNthCalledWith(
      2,
      DEFAULT_TENANT_ID,
      {
        ocppConnectionName: STATION,
        key: 'NumberOfConnectors',
        value: '2',
        readonly: true,
      },
    );
  });

  it('skips entries without a key', async () => {
    await respond({
      configurationKey: [
        { key: null, readonly: false, value: 'orphan' },
        { key: 'MeterValueSampleInterval', readonly: false, value: '60' },
      ],
    });

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledTimes(
      1,
    );
    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      expect.objectContaining({ key: 'MeterValueSampleInterval' }),
    );
  });

  it('empty configurationKey writes nothing', async () => {
    await respond({ configurationKey: [] });

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).not.toHaveBeenCalled();
  });

  it('missing configurationKey writes nothing', async () => {
    await respond({});

    expect(changeConfigurationRepository.createOrUpdateChangeConfiguration).not.toHaveBeenCalled();
  });
});
