// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { ILocalAuthListRepository } from '@citrineos/dal';
import {
  ChangeAvailabilityResponseOcpp16Handler,
  ClearCacheResponseOcpp16Handler,
  DataTransferResponseOcpp16Handler,
  GetDiagnosticsResponseOcpp16Handler,
  GetLocalListVersionResponseOcpp16Handler,
  RemoteStopTransactionResponseOcpp16Handler,
  ResetResponseOcpp16Handler,
  TriggerMessageResponseOcpp16Handler,
} from '@handlers/index.js';
import { createTestContainer, type MockLogger } from '@test/test-container.js';

const STATION = 'station-001';

function makeMessage<T extends OcppResponse>(action: OCPP_CallAction, payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
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

describe('GetLocalListVersionResponseOcpp16Handler', () => {
  let handler: GetLocalListVersionResponseOcpp16Handler;
  let validateOrReplace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const { logger } = createTestContainer();
    validateOrReplace = vi.fn().mockResolvedValue(undefined);
    handler = new GetLocalListVersionResponseOcpp16Handler({
      logger,
      localAuthListRepository: {
        validateOrReplaceLocalListVersionForStation: validateOrReplace,
      } as unknown as ILocalAuthListRepository,
    });
  });

  it('forwards tenant, reported version, and station to the local auth list repository', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.GetLocalListVersion, {
        listVersion: 42,
      } as OCPP1_6.GetLocalListVersionResponse),
    );

    expect(validateOrReplace).toHaveBeenCalledTimes(1);
    expect(validateOrReplace).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 42, STATION);
  });

  it('passes list version 0 through unchanged', async () => {
    await handler.handle(
      makeMessage(OCPP_CallAction.GetLocalListVersion, {
        listVersion: 0,
      } as OCPP1_6.GetLocalListVersionResponse),
    );

    expect(validateOrReplace).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 0, STATION);
  });

  it('propagates a repository failure to the caller', async () => {
    validateOrReplace.mockRejectedValueOnce(new Error('local list write failed'));

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetLocalListVersion, {
          listVersion: 7,
        } as OCPP1_6.GetLocalListVersionResponse),
      ),
    ).rejects.toThrow('local list write failed');
  });
});

describe('TriggerMessageResponseOcpp16Handler', () => {
  let handler: TriggerMessageResponseOcpp16Handler;
  let logger: MockLogger;

  function triggerMessage(status: OCPP1_6.TriggerMessageResponseStatus) {
    return makeMessage(OCPP_CallAction.TriggerMessage, {
      status,
    } as OCPP1_6.TriggerMessageResponse);
  }

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new TriggerMessageResponseOcpp16Handler({ logger });
  });

  it('does not flag an accepted trigger as a failure', async () => {
    await expect(
      handler.handle(triggerMessage(OCPP1_6.TriggerMessageResponseStatus.Accepted)),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs the failure with the rejected message attached', async () => {
    const message = triggerMessage(OCPP1_6.TriggerMessageResponseStatus.Rejected);

    await handler.handle(message);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('TriggerMessage failed with status:', message);
  });

  it('treats NotImplemented as a failure too', async () => {
    const message = triggerMessage(OCPP1_6.TriggerMessageResponseStatus.NotImplemented);

    await handler.handle(message);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('TriggerMessage failed with status:', message);
  });
});

// The six handlers below are log-only stubs: no repository, no sender, no
// branching on payload. Each block pins that down — the handler resolves for
// every status and never reports an error.

describe('RemoteStopTransactionResponseOcpp16Handler', () => {
  let handler: RemoteStopTransactionResponseOcpp16Handler;
  let logger: MockLogger;

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new RemoteStopTransactionResponseOcpp16Handler({ logger });
  });

  it('resolves for an accepted remote stop', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.RemoteStopTransaction, {
          status: OCPP1_6.RemoteStopTransactionResponseStatus.Accepted,
        } as OCPP1_6.RemoteStopTransactionResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves for a rejected remote stop without reporting an error', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.RemoteStopTransaction, {
          status: OCPP1_6.RemoteStopTransactionResponseStatus.Rejected,
        } as OCPP1_6.RemoteStopTransactionResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('GetDiagnosticsResponseOcpp16Handler', () => {
  let handler: GetDiagnosticsResponseOcpp16Handler;
  let logger: MockLogger;

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new GetDiagnosticsResponseOcpp16Handler({ logger });
  });

  it('resolves when the station names the upload file', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetDiagnostics, {
          fileName: 'diag-2026-08.tar.gz',
        } as OCPP1_6.GetDiagnosticsResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves when the station has no diagnostics to upload', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetDiagnostics, {} as OCPP1_6.GetDiagnosticsResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('DataTransferResponseOcpp16Handler', () => {
  let handler: DataTransferResponseOcpp16Handler;
  let logger: MockLogger;

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new DataTransferResponseOcpp16Handler({ logger });
  });

  it('resolves for an accepted transfer carrying data', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.DataTransfer, {
          status: OCPP1_6.DataTransferResponseStatus.Accepted,
          data: '{"ack":true}',
        } as OCPP1_6.DataTransferResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves for UnknownVendorId without reporting an error', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.DataTransfer, {
          status: OCPP1_6.DataTransferResponseStatus.UnknownVendorId,
        } as OCPP1_6.DataTransferResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('ChangeAvailabilityResponseOcpp16Handler', () => {
  let handler: ChangeAvailabilityResponseOcpp16Handler;
  let logger: MockLogger;

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new ChangeAvailabilityResponseOcpp16Handler({ logger });
  });

  it('resolves for a scheduled availability change', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.ChangeAvailability, {
          status: OCPP1_6.ChangeAvailabilityResponseStatus.Scheduled,
        } as OCPP1_6.ChangeAvailabilityResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves for a rejected availability change without reporting an error', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.ChangeAvailability, {
          status: OCPP1_6.ChangeAvailabilityResponseStatus.Rejected,
        } as OCPP1_6.ChangeAvailabilityResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('ClearCacheResponseOcpp16Handler', () => {
  let handler: ClearCacheResponseOcpp16Handler;
  let logger: MockLogger;

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new ClearCacheResponseOcpp16Handler({ logger });
  });

  it('resolves for an accepted cache clear', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.ClearCache, {
          status: OCPP1_6.ClearCacheResponseStatus.Accepted,
        } as OCPP1_6.ClearCacheResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves for a rejected cache clear without reporting an error', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.ClearCache, {
          status: OCPP1_6.ClearCacheResponseStatus.Rejected,
        } as OCPP1_6.ClearCacheResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('ResetResponseOcpp16Handler', () => {
  let handler: ResetResponseOcpp16Handler;
  let logger: MockLogger;

  beforeEach(() => {
    ({ logger } = createTestContainer());
    handler = new ResetResponseOcpp16Handler({ logger });
  });

  it('resolves for an accepted reset', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.Reset, {
          status: OCPP1_6.ResetResponseStatus.Accepted,
        } as OCPP1_6.ResetResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves for a rejected reset without reporting an error', async () => {
    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.Reset, {
          status: OCPP1_6.ResetResponseStatus.Rejected,
        } as OCPP1_6.ResetResponse),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });
});
