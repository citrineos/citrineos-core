// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto, ConnectorDto, EvseDto } from '@citrineos/types';

export class EvseClass implements Partial<EvseDto> {
  id?: number;
  ocppConnectionName!: string;
  evseTypeId?: number;
  evseId!: string;
  physicalReference?: string | null;
  removed?: boolean;
  chargingStation?: ChargingStationDto;
  connectors?: ConnectorDto[] | null;
}
