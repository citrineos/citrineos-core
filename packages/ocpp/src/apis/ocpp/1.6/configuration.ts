// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { ChangeConfigurationEndpoint } from './configuration/change-configuration-endpoint.js';
import { GetConfigurationEndpoint } from './configuration/get-configuration-endpoint.js';
import { TriggerMessageEndpoint } from './configuration/trigger-message-endpoint.js';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  forwardMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.Configuration,
    bodySchema: () => bodySchema,
  });

export const CONFIGURATION_MESSAGE_ENDPOINTS = [
  TriggerMessageEndpoint,
  ChangeConfigurationEndpoint,
  GetConfigurationEndpoint,
  ocpp16(OCPP_CallAction.Reset, OCPP1_6.ResetRequestSchema),
  ocpp16(OCPP_CallAction.ChangeAvailability, OCPP1_6.ChangeAvailabilityRequestSchema),
  ocpp16(OCPP_CallAction.UpdateFirmware, OCPP1_6.UpdateFirmwareRequestSchema),
  ocpp16(OCPP_CallAction.SignedUpdateFirmware, OCPP1_6.SignedUpdateFirmwareRequestSchema),
  ocpp16(OCPP_CallAction.DataTransfer, OCPP1_6.DataTransferRequestSchema),
] satisfies ReadonlyArray<MessageEndpointClass>;
