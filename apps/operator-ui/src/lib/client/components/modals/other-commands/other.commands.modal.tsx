// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/base';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { selectIsModalOpen } from '@lib/utils/store/modal.slice';
import { Loader2 } from 'lucide-react';
import { plainToInstance } from 'class-transformer';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import { OCPP1_6_Commands } from './1.6';
import { OCPP2_0_1_Commands } from './2.0.1';

export interface OtherCommandsModalProps {
  station: any;
}

export const OtherCommandsModal = ({ station }: OtherCommandsModalProps) => {
  const translate = useTranslate();
  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;
  const [loading, setLoading] = useState<boolean>(false);
  const isModalOpen = useSelector(selectIsModalOpen);

  useEffect(() => {
    if (isModalOpen) {
      setLoading(false);
    }
  }, [isModalOpen]);

  // Dynamically render the appropriate component based on protocol version
  const renderCommandsByProtocol = () => {
    switch (parsedStation.protocol) {
      case OCPPVersion.OCPP1_6:
        return <OCPP1_6_Commands station={parsedStation} />;
      case OCPPVersion.OCPP2_0_1:
      case OCPPVersion.OCPP2_1:
        return <OCPP2_0_1_Commands station={parsedStation} />;
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

  return (
    <div className="mx-4">
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {!loading && renderCommandsByProtocol()}
    </div>
  );
};
