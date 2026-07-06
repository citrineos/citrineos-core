// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto } from '@citrineos/base';
import { Button } from '@lib/client/components/ui/button';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface ClearCacheModalProps {
  station: any;
}

export const ClearCacheModal = ({ station }: ClearCacheModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const handleSubmit = async () => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Clear Cache request because station ID is missing.');
      return;
    }

    await triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/evdriver/clearCache?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data: {},
      setLoading,
      ocppVersion: parsedStation.protocol,
    });

    dispatch(closeModal());
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>{translate('ChargingStations.clearCacheModal.description')}</p>
        <p className="mt-2">{translate('ChargingStations.clearCacheModal.proceed')}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => dispatch(closeModal())}>
          {translate('Common.cancel')}
        </Button>
        <Button variant="secondary" onClick={handleSubmit} disabled={loading}>
          {loading
            ? translate('ChargingStations.clearCacheModal.clearing')
            : translate('ChargingStations.commands.clearCache')}
        </Button>
      </div>
    </div>
  );
};
