// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointDeclaration,
  type IOcppSender,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, type OCPP2_1, OCPP_CallAction, type OCPPVersion } from '@citrineos/types';
import { validateTariffConditionsTimeFields } from '@util/index.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
}

export class SetDefaultTariffEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.SetDefaultTariff,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'transactions',
    bodySchema: ocpp2Schema('SetDefaultTariffRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;

  constructor({ logger, ocppSender }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_1.SetDefaultTariffRequest,
    callbackUrl: string | undefined,
    tenantId: number | undefined,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const validation = validateTariffConditionsTimeFields(request.tariff);
    if (!validation.isValid) {
      return [{ success: false, payload: validation.errorMessage }];
    }

    return Promise.all(
      identifiers.map((ocppConnectionName) =>
        this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId: tenantId ?? DEFAULT_TENANT_ID,
          protocol: version,
          action: OCPP_CallAction.SetDefaultTariff,
          eventGroup: EventGroup.Transactions,
          payload: request,
          callbackUrl,
        }),
      ),
    );
  }
}
