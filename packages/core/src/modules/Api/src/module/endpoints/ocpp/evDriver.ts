// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { CancelReservationEndpoint } from './evDriver/CancelReservationEndpoint.js';
import { RequestStartTransactionEndpoint } from './evDriver/RequestStartTransactionEndpoint.js';
import { ReserveNowEndpoint } from './evDriver/ReserveNowEndpoint.js';
import { SendLocalList16Endpoint } from './evDriver/SendLocalList16Endpoint.js';
import { SendLocalListEndpoint } from './evDriver/SendLocalListEndpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  passthroughMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    endpointPrefixConfigKey: 'evdriver',
    eventGroup: EventGroup.EVDriver,
    bodySchema: () => bodySchema,
  });

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  passthroughMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'evdriver',
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema(schemaName),
  });

export const EV_DRIVER_MESSAGE_ENDPOINTS = [
  ocpp16(OCPP_CallAction.RemoteStartTransaction, OCPP1_6.RemoteStartTransactionRequestSchema),
  ocpp16(OCPP_CallAction.RemoteStopTransaction, OCPP1_6.RemoteStopTransactionRequestSchema),
  ocpp16(OCPP_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorRequestSchema),
  ocpp16(OCPP_CallAction.ClearCache, OCPP1_6.ClearCacheRequestSchema),
  SendLocalList16Endpoint,
  ocpp16(OCPP_CallAction.GetLocalListVersion, OCPP1_6.GetLocalListVersionRequestSchema),
  RequestStartTransactionEndpoint,
  ocpp2(OCPP_CallAction.RequestStopTransaction, 'RequestStopTransactionRequestSchema'),
  CancelReservationEndpoint,
  ReserveNowEndpoint,
  ocpp2(OCPP_CallAction.UnlockConnector, 'UnlockConnectorRequestSchema'),
  ocpp2(OCPP_CallAction.ClearCache, 'ClearCacheRequestSchema'),
  SendLocalListEndpoint,
  ocpp2(OCPP_CallAction.GetLocalListVersion, 'GetLocalListVersionRequestSchema'),
  passthroughMessageEndpoint({
    action: OCPP_CallAction.NotifyWebPaymentStarted,
    protocols: [OCPPVersion.OCPP2_1],
    endpointPrefixConfigKey: 'evdriver',
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema('NotifyWebPaymentStartedRequestSchema'),
  }),
] satisfies ReadonlyArray<MessageEndpointClass>;
