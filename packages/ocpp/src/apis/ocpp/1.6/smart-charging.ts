// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  forwardMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.SmartCharging,
    bodySchema: () => bodySchema,
  });

export const SMART_CHARGING_MESSAGE_ENDPOINTS = [
  ocpp16(OCPP_CallAction.SetChargingProfile, OCPP1_6.SetChargingProfileRequestSchema),
  ocpp16(OCPP_CallAction.ClearChargingProfile, OCPP1_6.ClearChargingProfileRequestSchema),
  ocpp16(OCPP_CallAction.GetCompositeSchedule, OCPP1_6.GetCompositeScheduleRequestSchema),
] satisfies ReadonlyArray<MessageEndpointClass>;
