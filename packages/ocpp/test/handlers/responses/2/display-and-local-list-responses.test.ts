// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  ChargingStationSequenceTypeEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { ILocalAuthListRepository, IMessageInfoRepository } from '@citrineos/dal';
import {
  ClearDisplayMessageResponseOcpp2Handler,
  CostUpdatedResponseOcpp2Handler,
  CustomerInformationResponseOcpp2Handler,
  GetDisplayMessagesResponseOcpp2Handler,
  GetLocalListVersionResponseOcpp2Handler,
  SendLocalListResponseOcpp2Handler,
  SetDisplayMessageResponseOcpp2Handler,
} from '@handlers/index.js';
import {
  createTestContainer,
  getTestInstance,
  makeMockOcppSender,
  type MockOcppSender,
} from '@test/test-container.js';
import type { IdGenerator } from '@util/index.js';
import { asValue } from 'awilix';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION_ID = 'corr-001';

function makeMessage<T extends OcppResponse>(action: string, payload: T): IMessage<T> {
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
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

describe('SendLocalListResponseOcpp2Handler', () => {
  const { container, logger } = createTestContainer();
  // Original request as stored by the OCPPMessage log; the handler replays it into the version table.
  const STORED_REQUEST = { versionNumber: 3, updateType: 'Full' };
  let localAuthListRepository: Mocked<ILocalAuthListRepository>;
  let ocppSender: MockOcppSender;

  beforeEach(() => {
    vi.clearAllMocks();
    localAuthListRepository = {
      getSendLocalListRequestByStationIdAndCorrelationId: vi.fn().mockResolvedValue(STORED_REQUEST),
      createOrUpdateLocalListVersionFromStationIdAndSendLocalList: vi
        .fn()
        .mockResolvedValue(undefined),
    } as unknown as Mocked<ILocalAuthListRepository>;
    ocppSender = makeMockOcppSender();
  });

  function getHandler() {
    return getTestInstance(container, SendLocalListResponseOcpp2Handler, {
      localAuthListRepository,
      ocppSender,
    });
  }

  it('Accepted persists the version from the original request looked up by correlation id', async () => {
    await getHandler().handle(
      makeMessage(OCPP_CallAction.SendLocalList, {
        status: OCPP2_0_1.SendLocalListStatusEnumType.Accepted,
      }),
    );

    expect(
      localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId,
    ).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, STATION, CORRELATION_ID);
    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, STATION, STORED_REQUEST);
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('missing original request aborts before any write or follow-up call', async () => {
    localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId.mockResolvedValue(
      undefined,
    );

    await expect(
      getHandler().handle(
        makeMessage(OCPP_CallAction.SendLocalList, {
          status: OCPP2_0_1.SendLocalListStatusEnumType.Accepted,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Unable to process SendLocalListResponse. SendLocalListRequest not found for StationId ${STATION} by CorrelationId ${CORRELATION_ID}.`,
    );
  });

  it('Failed writes nothing and sends nothing', async () => {
    await getHandler().handle(
      makeMessage(OCPP_CallAction.SendLocalList, {
        status: OCPP2_0_1.SendLocalListStatusEnumType.Failed,
      }),
    );

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('VersionMismatch requests the station list version instead of writing', async () => {
    await getHandler().handle(
      makeMessage(OCPP_CallAction.SendLocalList, {
        status: OCPP2_0_1.SendLocalListStatusEnumType.VersionMismatch,
      }),
    );

    expect(
      localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList,
    ).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).toHaveBeenCalledExactlyOnceWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetLocalListVersion,
      eventGroup: EventGroup.EVDriver,
      payload: {},
    });
  });

  it('VersionMismatch still resolves when the follow-up call is refused', async () => {
    ocppSender.sendCall.mockResolvedValue({ success: false });

    await expect(
      getHandler().handle(
        makeMessage(OCPP_CallAction.SendLocalList, {
          status: OCPP2_0_1.SendLocalListStatusEnumType.VersionMismatch,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `Unable to send GetLocalListVersionRequest for StationId ${STATION} due to SendLocalListRequest version mismatch.`,
      { success: false },
    );
  });
});

describe('GetLocalListVersionResponseOcpp2Handler', () => {
  const { container } = createTestContainer();
  let localAuthListRepository: Mocked<ILocalAuthListRepository>;

  beforeEach(() => {
    localAuthListRepository = {
      validateOrReplaceLocalListVersionForStation: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<ILocalAuthListRepository>;
  });

  it('forwards tenant, reported version, and station to the repository', async () => {
    const handler = getTestInstance(container, GetLocalListVersionResponseOcpp2Handler, {
      localAuthListRepository,
    });

    await handler.handle(makeMessage(OCPP_CallAction.GetLocalListVersion, { versionNumber: 12 }));

    expect(
      localAuthListRepository.validateOrReplaceLocalListVersionForStation,
    ).toHaveBeenCalledExactlyOnceWith(DEFAULT_TENANT_ID, 12, STATION);
  });

  it('propagates a repository failure', async () => {
    localAuthListRepository.validateOrReplaceLocalListVersionForStation.mockRejectedValue(
      new Error('db down'),
    );
    const handler = getTestInstance(container, GetLocalListVersionResponseOcpp2Handler, {
      localAuthListRepository,
    });

    await expect(
      handler.handle(makeMessage(OCPP_CallAction.GetLocalListVersion, { versionNumber: 12 })),
    ).rejects.toThrow('db down');
  });
});

describe('SetDisplayMessageResponseOcpp2Handler', () => {
  const { container } = createTestContainer();
  const REQUEST_ID = 42;
  let messageInfoRepository: Mocked<IMessageInfoRepository>;
  let idGenerator: Mocked<IdGenerator>;
  let ocppSender: MockOcppSender;

  beforeEach(() => {
    messageInfoRepository = {
      deactivateAllByStationId: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IMessageInfoRepository>;
    idGenerator = {
      generateRequestId: vi.fn().mockResolvedValue(REQUEST_ID),
    } as unknown as Mocked<IdGenerator>;
    ocppSender = makeMockOcppSender();
  });

  function getHandler() {
    return getTestInstance(container, SetDisplayMessageResponseOcpp2Handler, {
      messageInfoRepository,
      idGenerator,
      ocppSender,
    });
  }

  it('Accepted deactivates stored messages and refreshes them via GetDisplayMessages', async () => {
    await getHandler().handle(
      makeMessage(OCPP_CallAction.SetDisplayMessage, {
        status: OCPP2_0_1.DisplayMessageStatusEnumType.Accepted,
      }),
    );

    expect(messageInfoRepository.deactivateAllByStationId).toHaveBeenCalledExactlyOnceWith(
      DEFAULT_TENANT_ID,
      STATION,
    );
    expect(idGenerator.generateRequestId).toHaveBeenCalledExactlyOnceWith(
      DEFAULT_TENANT_ID,
      STATION,
      ChargingStationSequenceTypeEnum.getDisplayMessages,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledExactlyOnceWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetDisplayMessages,
      eventGroup: EventGroup.Configuration,
      payload: { requestId: REQUEST_ID },
    });
  });

  it('Rejected leaves stored messages untouched and sends nothing', async () => {
    await expect(
      getHandler().handle(
        makeMessage(OCPP_CallAction.SetDisplayMessage, {
          status: OCPP2_0_1.DisplayMessageStatusEnumType.Rejected,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(messageInfoRepository.deactivateAllByStationId).not.toHaveBeenCalled();
    expect(idGenerator.generateRequestId).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('a failed deactivation stops the refresh call', async () => {
    messageInfoRepository.deactivateAllByStationId.mockRejectedValue(new Error('db down'));

    await expect(
      getHandler().handle(
        makeMessage(OCPP_CallAction.SetDisplayMessage, {
          status: OCPP2_0_1.DisplayMessageStatusEnumType.Accepted,
        }),
      ),
    ).rejects.toThrow('db down');

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });
});

describe('ClearDisplayMessageResponseOcpp2Handler', () => {
  const { container } = createTestContainer();
  const REQUEST_ID = 77;
  let messageInfoRepository: Mocked<IMessageInfoRepository>;
  let idGenerator: Mocked<IdGenerator>;
  let ocppSender: MockOcppSender;

  beforeEach(() => {
    messageInfoRepository = {
      deactivateAllByStationId: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IMessageInfoRepository>;
    idGenerator = {
      generateRequestId: vi.fn().mockResolvedValue(REQUEST_ID),
    } as unknown as Mocked<IdGenerator>;
    ocppSender = makeMockOcppSender();
  });

  function getHandler() {
    return getTestInstance(container, ClearDisplayMessageResponseOcpp2Handler, {
      messageInfoRepository,
      idGenerator,
      ocppSender,
    });
  }

  it('Accepted deactivates stored messages and refreshes them via GetDisplayMessages', async () => {
    await getHandler().handle(
      makeMessage(OCPP_CallAction.ClearDisplayMessage, {
        status: OCPP2_0_1.ClearMessageStatusEnumType.Accepted,
      }),
    );

    expect(messageInfoRepository.deactivateAllByStationId).toHaveBeenCalledExactlyOnceWith(
      DEFAULT_TENANT_ID,
      STATION,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledExactlyOnceWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetDisplayMessages,
      eventGroup: EventGroup.Configuration,
      payload: { requestId: REQUEST_ID },
    });
  });

  it('Unknown leaves stored messages untouched and sends nothing', async () => {
    await expect(
      getHandler().handle(
        makeMessage(OCPP_CallAction.ClearDisplayMessage, {
          status: OCPP2_0_1.ClearMessageStatusEnumType.Unknown,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(messageInfoRepository.deactivateAllByStationId).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('a failed request id generation stops the refresh call', async () => {
    idGenerator.generateRequestId.mockRejectedValue(new Error('sequence unavailable'));

    await expect(
      getHandler().handle(
        makeMessage(OCPP_CallAction.ClearDisplayMessage, {
          status: OCPP2_0_1.ClearMessageStatusEnumType.Accepted,
        }),
      ),
    ).rejects.toThrow('sequence unavailable');

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });
});

// The three handlers below take only the logger. The sender is registered on the container
// rather than passed as a constructor dep, so the tests can still prove nothing goes outbound.
describe('GetDisplayMessagesResponseOcpp2Handler', () => {
  const { container, logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  container.register({ ocppSender: asValue(ocppSender) });

  it('resolves without sending or writing anything', async () => {
    const handler = getTestInstance(container, GetDisplayMessagesResponseOcpp2Handler, {});

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetDisplayMessages, {
          status: OCPP2_0_1.GetDisplayMessagesStatusEnumType.Accepted,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('CustomerInformationResponseOcpp2Handler', () => {
  const { container, logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  container.register({ ocppSender: asValue(ocppSender) });

  it('resolves without sending or writing anything', async () => {
    const handler = getTestInstance(container, CustomerInformationResponseOcpp2Handler, {});

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.CustomerInformation, {
          status: OCPP2_0_1.CustomerInformationStatusEnumType.Accepted,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('CostUpdatedResponseOcpp2Handler', () => {
  const { container, logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  container.register({ ocppSender: asValue(ocppSender) });

  it('resolves without sending or writing anything', async () => {
    const handler = getTestInstance(container, CostUpdatedResponseOcpp2Handler, {});

    await expect(
      handler.handle(makeMessage(OCPP_CallAction.CostUpdated, {})),
    ).resolves.toBeUndefined();

    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
