// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { CancelReservationEndpoint } from './evDriver/CancelReservationEndpoint.js';
import { RequestStartTransactionEndpoint } from './evDriver/RequestStartTransactionEndpoint.js';
import { ReserveNowEndpoint } from './evDriver/ReserveNowEndpoint.js';
import { SendLocalListEndpoint } from './evDriver/SendLocalListEndpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  forwardMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema(schemaName),
  });

export const EV_DRIVER_MESSAGE_ENDPOINTS = [
  RequestStartTransactionEndpoint,
  ocpp2(OCPP_CallAction.RequestStopTransaction, 'RequestStopTransactionRequestSchema'),
  CancelReservationEndpoint,
  ReserveNowEndpoint,
  ocpp2(OCPP_CallAction.UnlockConnector, 'UnlockConnectorRequestSchema'),
  ocpp2(OCPP_CallAction.ClearCache, 'ClearCacheRequestSchema'),
  SendLocalListEndpoint,
  ocpp2(OCPP_CallAction.GetLocalListVersion, 'GetLocalListVersionRequestSchema'),
  forwardMessageEndpoint({
    action: OCPP_CallAction.NotifyWebPaymentStarted,
    protocols: [OCPPVersion.OCPP2_1],
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema('NotifyWebPaymentStartedRequestSchema'),
  }),
] satisfies ReadonlyArray<MessageEndpointClass>;
