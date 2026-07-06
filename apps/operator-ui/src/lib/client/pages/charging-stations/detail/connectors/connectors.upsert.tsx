// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { type ConnectorDto, type TariffDto } from '@citrineos/base';
import {
  ConnectorFormatEnum,
  ConnectorPowerTypeEnum,
  ConnectorProps,
  ConnectorTypeEnum,
} from '@citrineos/base';
import { Form } from '@lib/client/components/form';
import {
  ComboboxFormField,
  FormField,
  formLabelStyle,
  formLabelWrapperStyle,
  formRequiredAsterisk,
} from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lib/client/components/ui/select';
import { ConnectorClass } from '@lib/cls/connector.dto';
import { CONNECTOR_CREATE_MUTATION, CONNECTOR_EDIT_MUTATION } from '@lib/queries/connectors';
import { TARIFF_LIST_QUERY } from '@lib/queries/tariffs';
import { ResourceType } from '@lib/utils/access.types';
import { getSerializedValues } from '@lib/utils/middleware';
import { getSelectedChargingStation } from '@lib/utils/store/selected.charging.station.slice';
import { useForm } from '@refinedev/react-hook-form';
import { useSelector } from 'react-redux';
import { Field, FieldError, FieldLabel } from '@lib/client/components/ui/field';
import { Controller } from 'react-hook-form';
import { ScrollArea } from '@ferdiunal/refine-shadcn/ui';
import { evsesFormUpsertGrid } from '@lib/client/pages/charging-stations/detail/evses/evses.list';
import { Combobox } from '@lib/client/components/combobox';
import { useList, useTranslate } from '@refinedev/core';
import { useTenantId } from '@lib/client/hooks/useTenantId';

interface ConnectorUpsertProps {
  onSubmit: () => void;
  connector: ConnectorDto | null;
  evseId?: number | null;
}

const connectorTypes = Object.keys(ConnectorTypeEnum);

const formats = Object.keys(ConnectorFormatEnum);

const powerTypes = Object.keys(ConnectorPowerTypeEnum);

export const ConnectorsUpsert: React.FC<ConnectorUpsertProps> = ({
  onSubmit,
  connector,
  evseId,
}) => {
  const translate = useTranslate();
  const selectedChargingStation = useSelector(getSelectedChargingStation());

  const tenantId = useTenantId();

  const form = useForm({
    refineCoreProps: {
      resource: ResourceType.CONNECTORS,
      id: connector?.id,
      redirect: false,
      action: connector ? 'edit' : 'create',
      mutationMode: 'pessimistic',
      meta: {
        gqlMutation: connector ? CONNECTOR_EDIT_MUTATION : CONNECTOR_CREATE_MUTATION,
      },
      onMutationSuccess: () => {
        onSubmit();
      },
    },
    defaultValues: {
      connectorId: connector?.connectorId || '',
      evseTypeConnectorId: connector?.evseTypeConnectorId || '',
      type: connector?.type || '',
      format: connector?.format || '',
      powerType: connector?.powerType || '',
      maximumAmperage: connector?.maximumAmperage || 0,
      maximumVoltage: connector?.maximumVoltage || 0,
      maximumPowerWatts: connector?.maximumPowerWatts || 0,
      termsAndConditionsUrl: connector?.termsAndConditionsUrl || '',
      tariffId: (connector as any)?.tariffId ?? undefined,
    },
  });

  const { query: tariffQuery } = useList<TariffDto>({
    resource: ResourceType.TARIFFS,
    meta: {
      gqlQuery: TARIFF_LIST_QUERY,
      gqlVariables: {
        order_by: { updatedAt: 'desc' },
        offset: 0,
        limit: 50,
      },
    },
    pagination: { mode: 'off' },
  });

  const tariffOptions = (tariffQuery.data?.data ?? []).map((tariff: TariffDto) => ({
    label: `#${tariff.id} - ${tariff.currency} ${tariff.pricePerKwh}/kWh`,
    value: tariff.id as number,
  }));

  const reset = () => {
    form.reset({
      connectorId: '',
      evseTypeConnectorId: '',
      type: '',
      format: '',
      powerType: '',
      maximumAmperage: 0,
      maximumVoltage: 0,
      maximumPowerWatts: 0,
      termsAndConditionsUrl: '',
      tariffId: undefined,
    });
  };

  const handleOnFinish = (data: any) => {
    const now = new Date().toISOString();

    const newItem: any = getSerializedValues({ ...data }, ConnectorClass);

    if (evseId) {
      newItem.evseId = evseId;
    }

    if (!newItem.id) {
      newItem.tenantId = tenantId;
      newItem.createdAt = now;
    }

    newItem.updatedAt = now;
    newItem.stationId = (connector as any)?.stationId ?? selectedChargingStation?.id;
    newItem.ocppConnectionName =
      (connector as any)?.ocppConnectionName ?? selectedChargingStation?.ocppConnectionName;

    form.refineCore.onFinish(newItem).then(() => reset());
  };

  return (
    <Form {...form} submitHandler={handleOnFinish}>
      <ScrollArea>
        <div className={evsesFormUpsertGrid}>
          <FormField
            control={form.control}
            name={ConnectorProps.connectorId}
            label={translate('ChargingStations.connectors.connectorId')}
            description={translate('ChargingStations.connectors.connectorIdDescription')}
          >
            <Input />
          </FormField>

          <FormField
            control={form.control}
            name={ConnectorProps.evseTypeConnectorId}
            label={translate('ChargingStations.connectors.evseTypeConnectorId')}
            description={translate('ChargingStations.connectors.evseTypeConnectorIdDescription')}
          >
            <Input />
          </FormField>

          <Controller
            name={ConnectorProps.type}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className={formLabelWrapperStyle}>
                  <span className={formLabelStyle}>
                    {translate('ChargingStations.connectors.type')}
                  </span>
                  {formRequiredAsterisk}
                </FieldLabel>
                <Combobox<string>
                  options={connectorTypes.map((ct) => ({
                    label: ct,
                    value: ct,
                  }))}
                  value={field.value ?? undefined}
                  onSelect={(value) => form.setValue(ConnectorProps.type, value)}
                  placeholder={translate('ChargingStations.connectors.selectType')}
                  searchPlaceholder={translate('ChargingStations.connectors.searchTypes')}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name={ConnectorProps.format}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className={formLabelWrapperStyle}>
                  <span className={formLabelStyle}>
                    {translate('ChargingStations.connectors.format')}
                  </span>
                  {formRequiredAsterisk}
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={translate('ChargingStations.connectors.selectFormat')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name={ConnectorProps.powerType}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className={formLabelWrapperStyle}>
                  <span className={formLabelStyle}>
                    {translate('ChargingStations.connectors.powerType')}
                  </span>
                  {formRequiredAsterisk}
                </FieldLabel>
                <Combobox<string>
                  options={powerTypes.map((pt) => ({
                    label: pt,
                    value: pt,
                  }))}
                  value={field.value ?? undefined}
                  onSelect={(value) => form.setValue(ConnectorProps.powerType, value)}
                  placeholder={translate('ChargingStations.connectors.selectPowerType')}
                  searchPlaceholder={translate('ChargingStations.connectors.searchPowerTypes')}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <FormField
            control={form.control}
            name={ConnectorProps.maximumAmperage}
            label={translate('ChargingStations.connectors.maximumAmperage')}
          >
            <Input type="number" />
          </FormField>

          <FormField
            control={form.control}
            name={ConnectorProps.maximumVoltage}
            label={translate('ChargingStations.connectors.maximumVoltage')}
          >
            <Input type="number" />
          </FormField>

          <FormField
            control={form.control}
            name={ConnectorProps.maximumPowerWatts}
            label={translate('ChargingStations.connectors.maximumPowerWatts')}
          >
            <Input type="number" />
          </FormField>

          <FormField
            control={form.control}
            name={ConnectorProps.termsAndConditionsUrl}
            label={translate('ChargingStations.connectors.termsAndConditionsUrl')}
          >
            <Input />
          </FormField>

          <ComboboxFormField<number, any>
            control={form.control}
            name="tariffId"
            label={translate('ChargingStations.connectors.tariff')}
            options={tariffOptions}
            placeholder={translate('ChargingStations.connectors.selectTariff')}
            searchPlaceholder={translate('ChargingStations.connectors.searchTariffs')}
            isLoading={tariffQuery.isLoading}
          />
        </div>
      </ScrollArea>
    </Form>
  );
};
