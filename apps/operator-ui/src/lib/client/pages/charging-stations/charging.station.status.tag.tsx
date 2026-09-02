// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationStatusEnum } from '@citrineos/types';
import GenericTag from '@lib/client/components/tag';
import {
  getChargingStationStatus,
  type ChargingStationStatusCountsDto,
} from '@lib/cls/charging.station.dto';

export interface ChargingStationStatusTagProps {
  station: ChargingStationStatusCountsDto;
}
export const ChargingStationStatusTag = ({ station }: ChargingStationStatusTagProps) => {
  const status = getChargingStationStatus(station);
  return (
    <GenericTag
      colorMap={{
        [ChargingStationStatusEnum.AVAILABLE]: 'green',
        [ChargingStationStatusEnum.CHARGING]: 'blue',
        [ChargingStationStatusEnum.CHARGING_SUSPENDED]: 'violet',
        [ChargingStationStatusEnum.RESERVED]: 'cyan',
        [ChargingStationStatusEnum.UNAVAILABLE]: 'gray',
        [ChargingStationStatusEnum.FAULTED]: 'red',
      }}
      enumType={ChargingStationStatusEnum}
      enumValue={status}
    />
  );
};
