// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction } from '@citrineos/types';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';
import { SetDefaultTariffEndpoint } from './transactions/SetDefaultTariffEndpoint.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  passthroughMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Transactions,
    bodySchema: ocpp2Schema(schemaName),
  });

export const TRANSACTIONS_MESSAGE_ENDPOINTS = [
  ocpp2(OCPP_CallAction.CostUpdated, 'CostUpdatedRequestSchema'),
  ocpp2(OCPP_CallAction.GetTransactionStatus, 'GetTransactionStatusRequestSchema'),
  SetDefaultTariffEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;
