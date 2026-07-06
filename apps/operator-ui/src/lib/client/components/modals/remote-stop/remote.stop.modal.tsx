// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationSchema, OCPPVersion, TransactionSchema } from '@citrineos/base';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { plainToInstance } from 'class-transformer';
import { useMemo } from 'react';
import { useTranslate } from '@refinedev/core';
import type { z } from 'zod';
import { OCPP1_6_RemoteStop } from './1.6';
import { OCPP2_0_1_RemoteStop } from './2.0.1';

const ChargingStationWithTransactionsSchema = ChargingStationSchema.extend({
  transactions: TransactionSchema.array(),
});
export type ChargingStationWithTransactionsDto = z.infer<
  typeof ChargingStationWithTransactionsSchema
>;

export interface RemoteStopTransactionModalProps {
  station: ChargingStationWithTransactionsDto;
}

export const RemoteStopTransactionModal = ({ station }: RemoteStopTransactionModalProps) => {
  const translate = useTranslate();
  const parsedStation: ChargingStationWithTransactionsDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationWithTransactionsDto;

  // Dynamically render the appropriate component based on protocol version
  const renderCommandsByProtocol = () => {
    switch (parsedStation.protocol) {
      case OCPPVersion.OCPP1_6:
        return <OCPP1_6_RemoteStop station={parsedStation} />;
      case OCPPVersion.OCPP2_0_1:
      case OCPPVersion.OCPP2_1:
        return <OCPP2_0_1_RemoteStop station={parsedStation} />;
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
