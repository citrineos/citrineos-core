// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto } from '@citrineos/base';
import { type ConnectorDto, ConnectorProps, OCPP1_6, OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { ComboboxFormField, SelectFormField } from '@lib/client/components/form/field';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { CONNECTOR_LIST_FOR_STATION_QUERY } from '@lib/queries/connectors';
import { ResourceType } from '@lib/utils/access.types';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useSelect, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface TriggerMessageModalProps {
  station: ChargingStationDto;
}

type TriggerMessageFormData = {
  requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage;
  connectorId?: number;
};

const triggerMessages = Object.keys(OCPP1_6.TriggerMessageRequestRequestedMessage);

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
        requestedMessage: z.enum(OCPP1_6.TriggerMessageRequestRequestedMessage, {
          message: translate('ChargingStations.triggerMessageModal.selectMessageError'),
        }),
        connectorId: z.number().optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(TriggerMessageSchema),
    defaultValues: {
      requestedMessage: undefined,
      connectorId: undefined,
    },
  });

  const { options, onSearch, query } = useSelect<ConnectorDto>({
    resource: ResourceType.CONNECTORS,
    optionLabel: 'connectorId',
    optionValue: 'connectorId',
    meta: {
      gqlQuery: CONNECTOR_LIST_FOR_STATION_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 10,
        stationId: parsedStation.id,
      },
    },
    sorters: [{ field: ConnectorProps.connectorId, order: 'asc' }],
    pagination: { mode: 'off' },
    onSearch: (value: string) => {
      const connectorId = Number(value);
      if (!connectorId || !Number.isInteger(connectorId) || connectorId < 1) {
        return [];
      }
      return [
        {
          operator: 'or',
          value: [{ field: ConnectorProps.connectorId, operator: 'eq', value }],
        },
      ];
    },
  });

  const handleSubmit = (values: TriggerMessageFormData) => {
    const data: any = {
      requestedMessage: values.requestedMessage,
    };

    if (values.connectorId !== undefined) {
      data.connectorId = values.connectorId;
    }

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/triggerMessage?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion: OCPPVersion.OCPP1_6,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={handleSubmit}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <SelectFormField
        control={form.control}
        name="requestedMessage"
        label={translate('ChargingStations.triggerMessageModal.requestedMessage')}
        options={triggerMessages}
        placeholder={translate('ChargingStations.triggerMessageModal.selectMessage')}
        required
      />

      <ComboboxFormField
        control={form.control}
        name="connectorId"
        label={translate('ChargingStations.connectorSelector.label')}
        options={options}
        onSearch={onSearch}
        placeholder={translate('ChargingStations.connectorSelector.searchPlaceholder')}
        isLoading={query.isLoading}
      />
    </Form>
  );
};
