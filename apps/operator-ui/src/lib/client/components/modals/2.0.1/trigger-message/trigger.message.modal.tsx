// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo, useState } from 'react';
import type { ChargingStationDto } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { ComboboxFormField } from '@lib/client/components/form/field';
import { ConnectorSelector } from '@lib/client/components/modals/shared/connector-selector/connector.selector';
import { EvseSelector } from '@lib/client/components/modals/shared/evse-selector/evse.selector';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { Controller } from 'react-hook-form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface TriggerMessageModalProps {
  station: ChargingStationDto;
}

type TriggerMessageFormData = {
  requestedMessage: OCPP2_0_1.MessageTriggerEnumType;
  evse?: string;
  connectorId?: number;
};

const messageTriggers = Object.keys(OCPP2_0_1.MessageTriggerEnumType);

export const TriggerMessageModal = ({ station }: TriggerMessageModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const TriggerMessageSchema = useMemo(
    () =>
      z.object({
        requestedMessage: z.enum(OCPP2_0_1.MessageTriggerEnumType, {
          message: translate('ChargingStations.triggerMessageModal.selectMessageError'),
        }),
        evse: z.string().optional(), // { id, evseTypeId }
        connectorId: z.number().optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(TriggerMessageSchema),
    defaultValues: {
      requestedMessage: undefined,
      evse: undefined,
      connectorId: undefined,
    },
  });

  const handleSubmit = (values: TriggerMessageFormData) => {
    const data: any = {
      requestedMessage: values.requestedMessage,
    };

    if (values.evse !== undefined) {
      const parsedEvse = JSON.parse(values.evse);

      data.evse = {
        id: parsedEvse.evseTypeId,
        ...(values.connectorId !== undefined ? { connectorId: values.connectorId } : {}),
      };
    }

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/triggerMessage?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
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
      submitHandler={handleSubmit}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <ComboboxFormField
        control={form.control}
        name="requestedMessage"
        label={translate('ChargingStations.triggerMessageModal.requestedMessage')}
        options={messageTriggers.map((mt: string) => ({
          label: mt,
          value: mt,
        }))}
        placeholder={translate('ChargingStations.triggerMessageModal.selectMessageType')}
        searchPlaceholder={translate('ChargingStations.triggerMessageModal.searchMessageTypes')}
        required
      />

      <Controller
        control={form.control}
        name="evse"
        render={({ field }) => (
          <EvseSelector
            station={parsedStation}
            value={field.value ?? undefined}
            onSelect={handleEvseSelection}
            isOptional
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
            isOptional
            requiresEvseId
          />
        )}
      />
    </Form>
  );
};
