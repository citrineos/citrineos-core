// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type IMessage,
  type IVatProvider,
  DEFAULT_TENANT_ID,
  OCPPValidator,
} from '@citrineos/base';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { VatNumberValidationRequestOcpp21Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.VatNumberValidation,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_1,
  } as unknown as IMessage<T>;
}

describe('VatNumberValidationRequestOcpp21Handler', () => {
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let getVat: ReturnType<typeof vi.fn>;
  let handler: VatNumberValidationRequestOcpp21Handler;

  beforeEach(() => {
    const { logger } = createTestContainer();
    ocppSender = makeMockOcppSender();
    getVat = vi.fn();
    handler = new VatNumberValidationRequestOcpp21Handler({
      logger,
      ocppSender,
      viesVatProvider: { getVat } as unknown as IVatProvider,
    });
  });

  async function validate(
    request: OCPP2_1.VatNumberValidationRequest,
  ): Promise<OCPP2_1.VatNumberValidationResponse> {
    await handler.handle(makeMessage(request));
    return ocppSender.sendCallResultWithMessage.mock
      .calls[0][1] as OCPP2_1.VatNumberValidationResponse;
  }

  // C18.FR.09: the CSMS responds Rejected when the VAT number is invalid, and MAY return the
  // company address. company is an AddressType, so null is not a value it can carry.
  it('omits company when the VAT number does not resolve', async () => {
    getVat.mockResolvedValue(null);

    const response = await validate({ vatNumber: 'GB000000000' });

    expect(response.status).toBe(OCPP2_1.GenericStatusEnumType.Rejected);
    expect(response).not.toHaveProperty('company');
  });

  it('produces a response the schema accepts when the VAT number does not resolve', async () => {
    getVat.mockResolvedValue(null);

    const response = await validate({ vatNumber: 'GB000000000' });

    const { isValid, errors } = new OCPPValidator().validateOCPPResponse(
      OCPP_CallAction.VatNumberValidation,
      response,
      OCPPVersion.OCPP2_1,
    );
    expect(errors ?? []).toEqual([]);
    expect(isValid).toBe(true);
  });

  // C18.FR.10: the CSMS uses the same evseId in the response.
  it('echoes the evseId the station asked about', async () => {
    getVat.mockResolvedValue(null);

    const response = await validate({ vatNumber: 'GB000000000', evseId: 2 });

    expect(response.evseId).toBe(2);
  });

  it('returns the company when the VAT number resolves', async () => {
    const company: OCPP2_1.AddressType = {
      name: 'Example Ltd',
      address1: '1 Example Street',
      city: 'Example',
      country: 'GB',
    };
    getVat.mockResolvedValue(company);

    const response = await validate({ vatNumber: 'GB123456789' });

    expect(response.status).toBe(OCPP2_1.GenericStatusEnumType.Accepted);
    expect(response.company).toEqual(company);
  });
});
