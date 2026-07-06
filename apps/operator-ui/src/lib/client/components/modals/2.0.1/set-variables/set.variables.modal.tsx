// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import {
  type ChargingStationDto,
  type ComponentDto,
  ComponentProps,
  OCPP2_0_1,
} from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
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
import React, { useMemo, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { Form } from '@lib/client/components/form';
import { AddArrayItemButton } from '@lib/client/components/form/add-array-item-button';
import { RemoveArrayItemButton } from '@lib/client/components/form/remove-array-item-button';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { Alert, AlertDescription } from '@lib/client/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useTenantId } from '@lib/client/hooks/useTenantId';

interface SetVariablesModalProps {
  station: any;
}

type SetVariablesFormData = {
  setVariableData: {
    componentId: number | string;
    variableId: number | string;
    value: string;
    attributeType?: OCPP2_0_1.AttributeEnumType;
  }[];
};

const attributeTypes = Object.keys(OCPP2_0_1.AttributeEnumType);

export const SetVariablesModal = ({ station }: SetVariablesModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);
  const [variableOptionsMap, setVariableOptionsMap] = useState<
    Record<number, { label: string; value: number }[]>
  >({});

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const SetVariablesSchema = useMemo(() => {
    const requiredIdOrName = (label: string) =>
      z.custom<number | string>(
        (val) =>
          (typeof val === 'number' && val > 0) ||
          (typeof val === 'string' && val.trim().length > 0),
        translate('ChargingStations.fieldRequired', { field: label }),
      );

    const SetVariableDataSchema = z.object({
      componentId: requiredIdOrName(translate('ChargingStations.getVariablesModal.component')),
      variableId: requiredIdOrName(translate('ChargingStations.getVariablesModal.variable')),
      value: z.string().min(1, translate('ChargingStations.setVariablesModal.valueRequired')),
      attributeType: z.enum(OCPP2_0_1.AttributeEnumType).optional(),
    });

    return z.object({
      setVariableData: z
        .array(SetVariableDataSchema)
        .min(1, translate('ChargingStations.getVariablesModal.atLeastOneVariable'))
        .refine((data) => data.every((item) => item.componentId && item.variableId && item.value), {
          message: translate('ChargingStations.setVariablesModal.allFieldsRequired'),
        }),
    });
  }, [translate]);

  const form = useForm({
    resolver: zodResolver(SetVariablesSchema),
    defaultValues: {
      setVariableData: [
        {
          componentId: 0,
          variableId: 0,
          value: '',
          attributeType: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'setVariableData',
  });

  const {
    options: componentOptions,
    onSearch: componentOnSearch,
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
    const componentId = form.watch(`setVariableData.${index}.componentId`);
    const numericComponentId = typeof componentId === 'number' && componentId > 0 ? componentId : 0;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { options, onSearch, query } = useSelect({
      resource: ResourceType.VARIABLES,
      optionLabel: 'name',
      optionValue: 'id',
      meta: {
        gqlQuery: VARIABLE_LIST_BY_COMPONENT_QUERY,
        gqlVariables: numericComponentId
          ? { componentId: numericComponentId, offset: 0, limit: 100, mutability: 'ReadOnly' }
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

  const onFinish = async (values: SetVariablesFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Set Variables request because station ID is missing.');
      return;
    }

    const setVariableData = values.setVariableData.map((item, index) => {
      const componentName =
        typeof item.componentId === 'string'
          ? item.componentId
          : (componentOptions.find((c) => c.value === item.componentId) as any)?.label || '';

      const variableName =
        typeof item.variableId === 'string'
          ? item.variableId
          : variableOptionsMap[index]?.find((v) => v.value === item.variableId)?.label || '';

      return {
        component: {
          name: componentName,
        },
        variable: {
          name: variableName,
        },
        attributeValue: item.value,
        ...(item.attributeType && { attributeType: item.attributeType }),
      };
    });

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/monitoring/setVariables?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data: { setVariableData },
      setLoading,
      ocppVersion: parsedStation.protocol,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={onFinish}
      submitButtonVariant={FormButtonVariants.submit}
      submitButtonLabel={translate('ChargingStations.commands.setVariables')}
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
              variableId: 0,
              value: '',
              attributeType: undefined,
            })
          }
          itemLabel={translate('ChargingStations.getVariablesModal.variable')}
        />
      </div>
      <div className="flex flex-col gap-6 w-full">
        {fields.map((field, index) => {
          const componentId = form.watch(`setVariableData.${index}.componentId`);
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
                name={`setVariableData.${index}.componentId`}
                options={componentOptions}
                onSearch={componentOnSearch}
                placeholder={translate('ChargingStations.getVariablesModal.selectComponent')}
                searchPlaceholder={translate('ChargingStations.getVariablesModal.searchComponents')}
                isLoading={componentQuery.isLoading}
                allowManualEntry
              />

              <ComboboxFormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.variableNumber', {
                  number: index + 1,
                })}
                name={`setVariableData.${index}.variableId`}
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
                label={translate('ChargingStations.setVariablesModal.valueNumber', {
                  number: index + 1,
                })}
                name={`setVariableData.${index}.value`}
              >
                <Input
                  placeholder={translate('ChargingStations.setVariablesModal.valuePlaceholder')}
                />
              </FormField>

              <SelectFormField
                control={form.control}
                label={translate('ChargingStations.getVariablesModal.attributeTypeNumber', {
                  number: index + 1,
                })}
                name={`setVariableData.${index}.attributeType`}
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
