// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction } from '@citrineos/types';
import { SetDisplayMessageEndpoint } from './configuration/set-display-message-endpoint.js';
import { SetNetworkProfileEndpoint } from './configuration/set-network-profile-endpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  forwardMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Configuration,
    bodySchema: ocpp2Schema(schemaName),
  });

export const CONFIGURATION_MESSAGE_ENDPOINTS = [
  SetNetworkProfileEndpoint,
  ocpp2(OCPP_CallAction.ClearDisplayMessage, 'ClearDisplayMessageRequestSchema'),
  ocpp2(OCPP_CallAction.GetDisplayMessages, 'GetDisplayMessagesRequestSchema'),
  ocpp2(OCPP_CallAction.PublishFirmware, 'PublishFirmwareRequestSchema'),
  SetDisplayMessageEndpoint,
  ocpp2(OCPP_CallAction.UnpublishFirmware, 'UnpublishFirmwareRequestSchema'),
  ocpp2(OCPP_CallAction.UpdateFirmware, 'UpdateFirmwareRequestSchema'),
  ocpp2(OCPP_CallAction.Reset, 'ResetRequestSchema'),
  ocpp2(OCPP_CallAction.ChangeAvailability, 'ChangeAvailabilityRequestSchema'),
  ocpp2(OCPP_CallAction.TriggerMessage, 'TriggerMessageRequestSchema'),
  ocpp2(OCPP_CallAction.DataTransfer, 'DataTransferRequestSchema'),
] satisfies ReadonlyArray<MessageEndpointClass>;
