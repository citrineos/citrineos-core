// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, HttpMethod } from '@citrineos/base';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { plainToInstance } from 'class-transformer';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@lib/client/components/ui/button';
import { useTranslate } from '@refinedev/core';

export interface ForceDisconnectModalProps {
  station: ChargingStationDto;
}

export const ForceDisconnectModal = ({ station }: ForceDisconnectModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const onOkay = async () => {
    await triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/ocpprouter/connection?ocppConnectionName=${parsedStation.ocppConnectionName}&tenantId=${parsedStation.tenantId}`,
      data: undefined,
      setLoading,
      ocppVersion: null,
      method: HttpMethod.Delete,
    });

    dispatch(closeModal());
  };

  const onCancel = async () => {
    dispatch(closeModal());
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {translate('ChargingStations.forceDisconnectMessage')}{' '}
          <span className="font-medium">{parsedStation.ocppConnectionName}</span>?
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {translate('ChargingStations.forceDisconnectCaution')}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {translate('buttons.cancel')}
        </Button>
        <Button variant="destructive" onClick={onOkay} disabled={loading}>
          {loading ? translate('buttons.saving') : translate('buttons.submit')}
        </Button>
      </div>
    </div>
  );
};
