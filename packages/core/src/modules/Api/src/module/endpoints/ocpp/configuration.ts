// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { ChangeConfigurationEndpoint } from './configuration/ChangeConfigurationEndpoint.js';
import { GetConfigurationEndpoint } from './configuration/GetConfigurationEndpoint.js';
import { SetDisplayMessageEndpoint } from './configuration/SetDisplayMessageEndpoint.js';
import { SetNetworkProfileEndpoint } from './configuration/SetNetworkProfileEndpoint.js';
import { TriggerMessage16Endpoint } from './configuration/TriggerMessage16Endpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  passthroughMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    endpointPrefixConfigKey: 'configuration',
    eventGroup: EventGroup.Configuration,
    bodySchema: () => bodySchema,
  });

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  passthroughMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'configuration',
    eventGroup: EventGroup.Configuration,
    bodySchema: ocpp2Schema(schemaName),
  });

export const CONFIGURATION_MESSAGE_ENDPOINTS = [
  TriggerMessage16Endpoint,
  ChangeConfigurationEndpoint,
  GetConfigurationEndpoint,
  ocpp16(OCPP_CallAction.Reset, OCPP1_6.ResetRequestSchema),
  ocpp16(OCPP_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityRequestSchema),
  ocpp16(OCPP_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareRequestSchema),
  ocpp16(OCPP_CallAction.SignedUpdateFirmware, OCPP1_6.SignedUpdateFirmwareRequestSchema),
  ocpp16(OCPP_CallAction.DataTransfer, OCPP1_6.DataTransferRequestSchema),
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
