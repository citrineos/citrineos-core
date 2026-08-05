// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';
import { ClearChargingProfileEndpoint } from './smartCharging/ClearChargingProfileEndpoint.js';
import { GetChargingProfilesEndpoint } from './smartCharging/GetChargingProfilesEndpoint.js';
import { GetCompositeScheduleEndpoint } from './smartCharging/GetCompositeScheduleEndpoint.js';
import { SetChargingProfileEndpoint } from './smartCharging/SetChargingProfileEndpoint.js';

const ocpp16 = (action: OCPP_CallAction, bodySchema: object) =>
  passthroughMessageEndpoint({
    action,
    protocols: [OCPPVersion.OCPP1_6],
    endpointPrefixConfigKey: 'smartcharging',
    eventGroup: EventGroup.SmartCharging,
    bodySchema: () => bodySchema,
  });

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  passthroughMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'smartcharging',
    eventGroup: EventGroup.SmartCharging,
    bodySchema: ocpp2Schema(schemaName),
  });

export const SMART_CHARGING_MESSAGE_ENDPOINTS = [
  ocpp16(OCPP_CallAction.SetChargingProfile, OCPP1_6.SetChargingProfileRequestSchema),
  ocpp16(OCPP_CallAction.ClearChargingProfile, OCPP1_6.ClearChargingProfileRequestSchema),
  ocpp16(OCPP_CallAction.GetCompositeSchedule, OCPP1_6.GetCompositeScheduleRequestSchema),
  ClearChargingProfileEndpoint,
  GetChargingProfilesEndpoint,
  SetChargingProfileEndpoint,
  ocpp2(OCPP_CallAction.ClearedChargingLimit, 'ClearedChargingLimitRequestSchema'),
  GetCompositeScheduleEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;
