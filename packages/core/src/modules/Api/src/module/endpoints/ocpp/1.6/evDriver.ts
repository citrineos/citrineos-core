// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { SendLocalListEndpoint } from './evDriver/SendLocalListEndpoint.js';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  passthroughMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.EVDriver,
    bodySchema: () => bodySchema,
  });

export const EV_DRIVER_MESSAGE_ENDPOINTS = [
  ocpp16(OCPP_CallAction.RemoteStartTransaction, OCPP1_6.RemoteStartTransactionRequestSchema),
  ocpp16(OCPP_CallAction.RemoteStopTransaction, OCPP1_6.RemoteStopTransactionRequestSchema),
  ocpp16(OCPP_CallAction.UnlockConnector, OCPP1_6.UnlockConnectorRequestSchema),
  ocpp16(OCPP_CallAction.ClearCache, OCPP1_6.ClearCacheRequestSchema),
  SendLocalListEndpoint,
  ocpp16(OCPP_CallAction.GetLocalListVersion, OCPP1_6.GetLocalListVersionRequestSchema),
] satisfies ReadonlyArray<MessageEndpointClass>;
