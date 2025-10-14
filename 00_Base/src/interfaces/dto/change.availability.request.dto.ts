// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OperationalStatusEnumType } from '../../ocpp/model/2.0.1';
import { IEvseDto } from './evse.dto';

export interface IChangeAvailabilityRequestDto {
  evse?: IEvseDto | null;
  operationalStatus: OperationalStatusEnumType;
  // customData?: CustomDataType | null; // todo
}

export enum ChangeAvailabilityRequestDtoProps {
  customData = 'customData',
  evse = 'evse',
  operationalStatus = 'operationalStatus',
}
