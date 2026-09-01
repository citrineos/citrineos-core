// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, forwardMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction } from '@citrineos/types';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';
import { ClearChargingProfileEndpoint } from './smartCharging/ClearChargingProfileEndpoint.js';
import { GetChargingProfilesEndpoint } from './smartCharging/GetChargingProfilesEndpoint.js';
import { GetCompositeScheduleEndpoint } from './smartCharging/GetCompositeScheduleEndpoint.js';
import { SetChargingProfileEndpoint } from './smartCharging/SetChargingProfileEndpoint.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  forwardMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.SmartCharging,
    bodySchema: ocpp2Schema(schemaName),
  });

export const SMART_CHARGING_MESSAGE_ENDPOINTS = [
  ClearChargingProfileEndpoint,
  GetChargingProfilesEndpoint,
  SetChargingProfileEndpoint,
  ocpp2(OCPP_CallAction.ClearedChargingLimit, 'ClearedChargingLimitRequestSchema'),
  GetCompositeScheduleEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;
