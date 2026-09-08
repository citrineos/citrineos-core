// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// The package barrel re-exports the handler index, which defines OCPP2_1_CommandHandler as a
// subclass of the class under test - so importing the handler through it leaves the base class
// undefined. Stub the barrel down to the three values the handler and its base read from it.
vi.mock('../../../src/index.js', async () => {
  const { CommandResultType } = await import('../../../src/model/command-result.js');
  const { CommandType } = await import('../../../src/model/command-type.js');
  const { ModuleId } = await import('../../../src/model/module-id.js');
  return { CommandResultType, CommandType, ModuleId };
});

import { OCPP2_0_1_CommandHandler } from '../../../src/util/ocpp-command-handlers/ocpp-201-command-handler.js';
import { CommandResultType } from '../../../src/model/command-result.js';
import { uidDelimiter } from '../../../src/model/dto/evse-dto.js';

/**
 * OCPI addresses an EVSE by a uid built as `<stationId><delimiter><evseId>`, and evse_uid is
 * optional on StartSession. OCPP 2.0.1 addresses it by the EVSE number, which is optional on
 * RequestStartTransaction - an absent one leaves the choice to the station.
 */
const STATION = 'CS001';
const OCPP_EVSE_NUMBER = 3;

const chargingStation = { id: 5, ocppConnectionName: STATION } as never;

const tenantPartner = {
  id: 3,
  countryCode: 'GB',
  partyId: 'MSP',
  partnerProfileOCPI: {},
  tenant: { id: 1, countryCode: 'GB', partyId: 'VLT' },
} as never;

/** Capture the OCPP payload the handler builds instead of putting it on the wire. */
function aHandler() {
  const sent: { url: string; payload: any }[] = [];
  const postCommandResult = vi.fn().mockResolvedValue(undefined);

  const handler = new OCPP2_0_1_CommandHandler({
    ajv: {} as never,
    logger: new Logger({ type: 'hidden' }),
    commandsClientApi: { postCommandResult } as never,
    ocpiGraphqlClient: {
      request: vi.fn().mockResolvedValue({ ChargingStationSequences: [] }),
    } as never,
    tokensMapper: {
      mapOcpiTokenTypeToOcppIdTokenType: () => 'ISO14443',
    } as never,
    config: {
      commands: {
        coreHeaders: {},
        ocpiBaseUrl: 'http://ocpi.test',
        ocpp2_0_1: {
          requestStartTransactionRequestUrl: 'http://core.test/remoteStart',
        },
      },
    } as never,
  });

  (handler as never as { sendOCPPMessage: unknown }).sendOCPPMessage = async (
    url: string,
    payload: any,
  ) => {
    sent.push({ url, payload });
  };

  return { handler, sent, postCommandResult };
}

const aStartSession = (evseUid?: string | null) =>
  ({
    evse_uid: evseUid,
    token: { uid: 'TAG001', type: 'RFID' },
    response_url: 'http://msp.test/commands/START_SESSION/1',
  }) as never;

describe('An OCPI StartSession sent to an OCPP 2.0.1 station', () => {
  it('sends the EVSE the command names', async () => {
    const { handler, sent } = aHandler();

    await handler.sendStartSessionCommand(
      aStartSession(`${STATION}${uidDelimiter}${OCPP_EVSE_NUMBER}`),
      tenantPartner,
      chargingStation,
      'command-1',
    );

    expect(sent).toHaveLength(1);
    expect(sent[0].payload).toMatchObject({ evseId: OCPP_EVSE_NUMBER });
  });

  it('leaves the EVSE to the station when the command names none', async () => {
    const { handler, sent } = aHandler();

    await handler.sendStartSessionCommand(
      aStartSession(undefined),
      tenantPartner,
      chargingStation,
      'command-1',
    );

    expect(sent).toHaveLength(1);
    expect(sent[0].payload).not.toHaveProperty('evseId');
  });

  it('reports a failure for an EVSE uid it cannot read', async () => {
    const { handler, sent, postCommandResult } = aHandler();

    await handler.sendStartSessionCommand(
      aStartSession('not-an-evse-uid'),
      tenantPartner,
      chargingStation,
      'command-1',
    );

    expect(sent).toHaveLength(0);
    expect(postCommandResult).toHaveBeenCalled();
    expect(postCommandResult.mock.calls[0][2]).toMatchObject({
      result: CommandResultType.FAILED,
    });
  });
});
