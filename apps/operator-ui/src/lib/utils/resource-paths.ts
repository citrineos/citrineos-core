// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const CHARGING_STATIONS_SEGMENT = 'charging-stations';

export const encodeSegment = (value: string): string => encodeURIComponent(value);

export const chargingStationPath = (ocppConnectionName: string): string =>
  `/${CHARGING_STATIONS_SEGMENT}/${encodeSegment(ocppConnectionName)}`;

export const chargingStationEditPath = (ocppConnectionName: string): string =>
  `${chargingStationPath(ocppConnectionName)}/edit`;
