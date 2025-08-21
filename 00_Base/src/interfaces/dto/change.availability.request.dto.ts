import { OperationalStatusEnumType } from '../../ocpp/model/2.0.1/index.js';
import { IEvseDto } from './evse.dto.js';

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
