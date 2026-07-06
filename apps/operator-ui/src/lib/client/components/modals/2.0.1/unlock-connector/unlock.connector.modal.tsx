// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConnectorSelector } from '@lib/client/components/modals/shared/connector-selector/connector.selector';
import { EvseSelector } from '@lib/client/components/modals/shared/evse-selector/evse.selector';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { Form } from '@lib/client/components/form';
import { Controller } from 'react-hook-form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

interface UnlockConnectorModalProps {
  station: any;
}

type UnlockConnectorFormData = {
  evse: string;
  connectorId: number;
};

export const UnlockConnectorModal = ({ station }: UnlockConnectorModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const UnlockConnectorSchema = useMemo(
    () =>
      z.object({
        evse: z.string({
          message: translate('ChargingStations.fieldRequired', {
            field: translate('ChargingStations.evseSelector.label'),
          }),
        }), // { id, evseTypeId }
        connectorId: z.number({
          message: translate('ChargingStations.fieldRequired', {
            field: translate('ChargingStations.connectorSelector.label'),
          }),
        }),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(UnlockConnectorSchema),
    defaultValues: {
      evse: undefined,
      connectorId: undefined,
    },
  });

  const onFinish = (values: UnlockConnectorFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Unlock Connector request because station ID is missing.');
      return;
    }

    const parsedEvse = JSON.parse(values.evse);

    const data = {
      evseId: parsedEvse.evseTypeId,
      connectorId: values.connectorId,
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/evdriver/unlockConnector?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion: parsedStation.protocol,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  const handleEvseSelection = (value: string) => {
    form.setValue('evse', value);
    form.setValue('connectorId', 1);
  };

  const handleConnectorSelection = (value: number) => {
    form.setValue('connectorId', value);
  };

  const selectedEvseId = form.watch('evse');

  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={onFinish}
      submitButtonVariant={FormButtonVariants.submit}
      submitButtonLabel={translate('ChargingStations.commands.unlockConnector')}
      hideCancel
    >
      <Controller
        control={form.control}
        name="evse"
        render={({ field }) => (
          <EvseSelector
            station={parsedStation}
            value={field.value ?? undefined}
            onSelect={handleEvseSelection}
          />
        )}
      />

      <Controller
        control={form.control}
        name="connectorId"
        render={({ field }) => (
          <ConnectorSelector
            station={parsedStation}
            evseId={selectedEvseId ? JSON.parse(selectedEvseId).id : undefined}
            value={field.value ?? undefined}
            onSelect={handleConnectorSelection}
          />
        )}
      />
    </Form>
  );
};
