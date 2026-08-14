// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ChargingStationDto, type EvseDto, OCPPVersion } from '@citrineos/types';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { plainToInstance } from 'class-transformer';
import { useMemo } from 'react';
import { useTranslate } from '@refinedev/core';
import { OCPP1_6_RemoteStart } from './1.6';
import { OCPP2_0_1_RemoteStart } from './2.0.1';

export interface RemoteStartTransactionModalProps {
  station: any;
  /**
   * Preselects the EVSE. OCPP 1.6 has no EVSE concept and ignores this - its modal selects a
   * connector instead.
   */
  evse?: EvseDto;
}

export const RemoteStartTransactionModal = ({
  station,
  evse,
}: RemoteStartTransactionModalProps) => {
  const translate = useTranslate();
  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  // Dynamically render the appropriate component based on protocol version
  const renderCommandsByProtocol = () => {
    switch (parsedStation.protocol) {
      case OCPPVersion.OCPP1_6:
        return <OCPP1_6_RemoteStart station={parsedStation} />;
      case OCPPVersion.OCPP2_0_1:
      case OCPPVersion.OCPP2_1:
        return <OCPP2_0_1_RemoteStart station={parsedStation} evse={evse} />;
      default:
        return (
          <div>
            {translate('ChargingStations.unsupportedProtocol', {
              protocol: parsedStation.protocol,
            })}
          </div>
        );
    }
  };

  return <div>{renderCommandsByProtocol()}</div>;
};
