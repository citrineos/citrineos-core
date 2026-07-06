// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useMemo, useState } from 'react';
import {
  type ChargingStationDto,
  type ComponentDto,
  ComponentProps,
  OCPP2_0_1,
} from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import {
  ComboboxFormField,
  FormField,
  nestedFormRowFlex,
  SelectFormField,
} from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { COMPONENT_LIST_QUERY } from '@lib/queries/components';
import { VARIABLE_LIST_BY_COMPONENT_QUERY } from '@lib/queries/variables';
import { ResourceType } from '@lib/utils/access.types';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useSelect, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useFieldArray } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { RemoveArrayItemButton } from '@lib/client/components/form/remove-array-item-button';
import { AddArrayItemButton } from '@lib/client/components/form/add-array-item-button';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { Alert, AlertDescription } from '@lib/client/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface GetVariablesModalProps {
  station: any;
}

export type GetVariablesFormData = {
  getVariableData: {
    componentId: number | string;
    variableId?: string;
    componentInstance?: string;
    variableInstance?: string;
    evseId?: number;
    connectorId?: number;
    attributeType?: OCPP2_0_1.AttributeEnumType;
  }[];
};

const attributeTypes = Object.keys(OCPP2_0_1.AttributeEnumType);

export const GetVariablesModal = ({ station }: GetVariablesModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const [variableOptionsMap, setVariableOptionsMap] = useState<
    Record<number, { label: string; value: string }[]>
  >({});
  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const GetVariablesSchema = useMemo(() => {
    const requiredIdOrName = (label: string) =>
      z.custom<number | string>(
        (val) =>
          (typeof val === 'number' && val > 0) ||
          (typeof val === 'string' && val.trim().length > 0),
        translate('ChargingStations.fieldRequired', { field: label }),
      );

    const GetVariableDataSchema = z.object({
      componentId: requiredIdOrName(translate('ChargingStations.getVariablesModal.component')),
      variableId: z.string().optional(),
      componentInstance: z.string().max(50).optional(),
      variableInstance: z.string().max(50).optional(),
      evseId: z.number().optional(),
      connectorId: z.number().optional(),
      attributeType: z.enum(OCPP2_0_1.AttributeEnumType).optional(),
    });

    return z.object({
      getVariableData: z
        .array(GetVariableDataSchema)
        .min(1, translate('ChargingStations.getVariablesModal.atLeastOneVariable'))
        .refine((data) => data.every((item) => item.componentId && item.variableId), {
          message: translate('ChargingStations.getVariablesModal.componentAndVariableRequired'),
        }),
    });
  }, [translate]);

  const form = useForm({
    resolver: zodResolver(GetVariablesSchema),
    defaultValues: {
      getVariableData: [
        {
          componentId: 0,
          variableId: '',
          componentInstance: '',
          variableInstance: '',
          evseId: undefined,
          connectorId: undefined,
          attributeType: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'getVariableData',
  });

  const {
    options: componentOptions,
    onSearch,
    query: componentQuery,
  } = useSelect<ComponentDto>({
    resource: ResourceType.COMPONENTS,
    optionLabel: ComponentProps.name,
    optionValue: 'id',
    meta: {
      gqlQuery: COMPONENT_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 10,
      },
    },
    pagination: { mode: 'off' },
  });

  const variableSelects = fields.map((field, index) => {
    const componentId = form.watch(`getVariableData.${index}.componentId`);

    const numericComponentId = typeof componentId === 'number' && componentId > 0 ? componentId : 0;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { options, onSearch, query } = useSelect({
      resource: ResourceType.VARIABLES,
      optionLabel: 'name',
      optionValue: 'name',
      meta: {
        gqlQuery: VARIABLE_LIST_BY_COMPONENT_QUERY,
        gqlVariables: numericComponentId
          ? { componentId: numericComponentId, offset: 0, limit: 100, mutability: '' }
          : undefined,
      },
      pagination: { mode: 'off' },
      queryOptions: { enabled: numericComponentId > 0 },
    });

    if (numericComponentId > 0 && options.length > 0 && variableOptionsMap[index] !== options) {
      setVariableOptionsMap((prev) => ({ ...prev, [index]: options }));
    }

    return { options, onSearch, isLoading: query.isLoading };
  });

  const onFinish = async (values: GetVariablesFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Get Variables request because station ID is missing.');
      return;
    }

    const getVariableData = values.getVariableData.map((item) => {
      const componentName =
        typeof item.componentId === 'string'
          ? item.componentId
          : (componentOptions.find((c) => c.value === item.componentId) as any)?.label || '';

      const data: any = {
        component: {
          name: componentName,
          ...(item.componentInstance && { instance: item.componentInstance }),
        },
        variable: {
          name: item.variableId || componentName,
          ...(item.variableInstance && { instance: item.variableInstance }),
        },
        ...(item.attributeType && { attributeType: item.attributeType }),
      };

      if (item.evseId !== undefined) {
        data.component.evse = {
          id: item.evseId,
          ...(item.connectorId !== undefined && {
            connectorId: item.connectorId,
          }),
        };
      }

      return data;
    });

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/monitoring/getVariables?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data: { getVariableData },
      setLoading,
      ocppVersion: parsedStation.protocol,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  // TODO do we also include Variable, EVSE, and Connector selectors?
  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={onFinish}
      submitButtonVariant={FormButtonVariants.submit}
      submitButtonlabel={translate('ChargingStations.commands.getVariables')}
      hideCancel
    >
      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>{translate('ChargingStations.getVariablesModal.alert')}</AlertDescription>
      </Alert>
      <div className="flex items-start">
        <AddArrayItemButton
          onAppendAction={() =>
            append({
              componentId: 0,
              variableId: '',
              componentInstance: '',
              variableInstance: '',
              evseId: undefined,
              connectorId: undefined,
              attributeType: undefined,
            })
          }
          itemLabel={translate('ChargingStations.getVariablesModal.variable')}
        />
      </div>
      <div className="flex flex-col gap-6 w-full">
        {fields.map((field, index) => {
          const componentId = form.watch(`getVariableData.${index}.componentId`);
          const {
            options: variableOptions,
            onSearch: variableOnSearch,
            isLoading: variableLoading,
          } = variableSelects[index] || {
            options: [],
            onSearch: () => {},
            isLoading: false,
          };

          return (
            <div key={field.id} className={nestedFormRowFlex}>
              <ComboboxFormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.componentNumber', {
                  number: index + 1,
                })}
                name={`getVariableData.${index}.componentId`}
                options={componentOptions}
                onSearch={onSearch}
                placeholder={translate('ChargingStations.getVariablesModal.selectComponent')}
                searchPlaceholder={translate('ChargingStations.getVariablesModal.searchComponents')}
                isLoading={componentQuery.isLoading}
                required
                allowManualEntry
              />

              <ComboboxFormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.variableNumber', {
                  number: index + 1,
                })}
                name={`getVariableData.${index}.variableId`}
                options={variableOptions}
                onSearch={variableOnSearch}
                placeholder={translate('ChargingStations.getVariablesModal.selectVariable')}
                searchPlaceholder={translate('ChargingStations.getVariablesModal.searchVariables')}
                isLoading={variableLoading}
                required
                disabled={!componentId || componentId === 0}
                allowManualEntry
              />

              <FormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.componentInstanceNumber', {
                  number: index + 1,
                })}
                name={`getVariableData.${index}.componentInstance`}
              >
                <Input placeholder={translate('ChargingStations.getVariablesModal.instance')} />
              </FormField>
              <FormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.variableInstanceNumber', {
                  number: index + 1,
                })}
                name={`getVariableData.${index}.variableInstance`}
              >
                <Input placeholder={translate('ChargingStations.getVariablesModal.instance')} />
              </FormField>

              <SelectFormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.attributeTypeNumber', {
                  number: index + 1,
                })}
                name={`getVariableData.${index}.attributeType`}
                options={attributeTypes}
                placeholder={translate('ChargingStations.getVariablesModal.selectAttributeType')}
              />

              <RemoveArrayItemButton onRemoveAction={() => remove(index)} />
            </div>
          );
        })}
      </div>
    </Form>
  );
};
