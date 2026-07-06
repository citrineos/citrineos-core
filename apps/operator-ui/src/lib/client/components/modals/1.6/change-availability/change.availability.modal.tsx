// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ChargingStationDto, type ConnectorDto } from '@citrineos/base';
import { ConnectorProps, OCPP1_6, OCPPVersion } from '@citrineos/base';
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
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface ChangeAvailabilityModalProps {
  station: ChargingStationDto;
}

type ChangeAvailabilityFormData = {
  type: OCPP1_6.ChangeAvailabilityRequestType;
  connectorId: number;
};

const availabilityTypes: OCPP1_6.ChangeAvailabilityRequestType[] = Object.keys(
  OCPP1_6.ChangeAvailabilityRequestType,
) as OCPP1_6.ChangeAvailabilityRequestType[];

export const ChangeAvailabilityModal = ({ station }: ChangeAvailabilityModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const ChangeAvailabilitySchema = useMemo(
    () =>
      z.object({
        type: z.enum(OCPP1_6.ChangeAvailabilityRequestType, {
          message: translate('ChargingStations.changeAvailabilityModal.selectAvailabilityError'),
        }),
        connectorId: z.number({
          message: translate('ChargingStations.changeAvailabilityModal.connectorRequired'),
        }),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(ChangeAvailabilitySchema),
    defaultValues: {
      type: undefined,
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

  const onFinish = async (values: ChangeAvailabilityFormData) => {
    const data = {
      type: values.type,
      connectorId: values.connectorId,
    };

    await triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/changeAvailability?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion: OCPPVersion.OCPP1_6,
    });

    form.reset({
      type: undefined,
      connectorId: undefined,
    });

    dispatch(closeModal());
  };

  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={onFinish}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <SelectFormField
        control={form.control}
        label={translate('ChargingStations.changeAvailabilityModal.availability')}
        name="type"
        options={availabilityTypes}
        required
      />
      <ComboboxFormField
        control={form.control}
        label={translate('ChargingStations.connectorSelector.label')}
        name="connectorId"
        description={translate('ChargingStations.connectorSelector.description')}
        options={options}
        onSearch={onSearch}
        placeholder={translate('ChargingStations.connectorSelector.selectConnector')}
        searchPlaceholder={translate('ChargingStations.connectorSelector.searchPlaceholder')}
        isLoading={query.isLoading}
        required
      />
    </Form>
  );
};
