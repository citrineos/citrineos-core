// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import { CHARGING_STATIONS_EDIT_MUTATION } from '@lib/queries/charging-stations';
import { closeModal } from '@lib/utils/store/modal-slice';
import { ResourceType } from '@lib/utils/access-types';
import { useTranslate, useUpdate } from '@refinedev/core';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

export interface ToggleStationOnlineModalProps {
  id: number;
  currentStatus: boolean;
  onSuccess?: () => void;
}

export const ToggleStationOnlineModal = ({
  id,
  currentStatus,
  onSuccess,
}: ToggleStationOnlineModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);
  const { mutate } = useUpdate();

  const newStatus = !currentStatus;
  const newStatusText = newStatus ? 'Online' : 'Offline';

  const handleSubmit = async () => {
    setLoading(true);

    mutate(
      {
        id,
        resource: ResourceType.CHARGING_STATIONS,
        values: { isOnline: newStatus },
        meta: {
          gqlMutation: CHARGING_STATIONS_EDIT_MUTATION,
        },
      },
      {
        onSuccess: () => {
          setLoading(false);
          dispatch(closeModal());
          onSuccess?.();
        },
        onError: () => {
          setLoading(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>
          {translate('ChargingStations.toggleOnlineWarning')} <strong>{newStatusText}</strong>.
        </p>
        <p className="mt-2 font-semibold text-destructive">
          {translate('ChargingStations.toggleOnlineCaution')}
        </p>
        <p className="mt-2">{translate('buttons.confirm')}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => dispatch(closeModal())}>
          {translate('buttons.cancel')}
        </Button>
        <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
          {loading ? translate('buttons.saving') : translate('buttons.confirmText')}
        </Button>
      </div>
    </div>
  );
};
