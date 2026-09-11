// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { MessageEndpointClass } from '@citrineos/base';
import { ClearChargingProfileEndpoint } from './smart-charging/clear-charging-profile-endpoint.js';
import { GetChargingProfilesEndpoint } from './smart-charging/get-charging-profiles-endpoint.js';
import { GetCompositeScheduleEndpoint } from './smart-charging/get-composite-schedule-endpoint.js';
import { SetChargingProfileEndpoint } from './smart-charging/set-charging-profile-endpoint.js';

export const SMART_CHARGING_MESSAGE_ENDPOINTS = [
  ClearChargingProfileEndpoint,
  GetChargingProfilesEndpoint,
  SetChargingProfileEndpoint,
  GetCompositeScheduleEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;
