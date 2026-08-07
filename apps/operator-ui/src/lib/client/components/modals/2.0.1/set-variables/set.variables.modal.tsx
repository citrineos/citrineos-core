// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import {
  type ChargingStationDto,
  type ComponentDto,
  ComponentProps,
  OCPP2_0_1,
} from '@citrineos/types';
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
import React, { useEffect, useMemo, useState } from 'react';
import { type Control, useFieldArray, useWatch } from 'react-hook-form';
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
  defaultSetVariable?: {
    componentName?: string;
    componentInstance?: string | null;
    variableName?: string;
    variableInstance?: string | null;
    value?: string;
    attributeType?: string;
  };
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

const SetVariableRow = ({
  control,
  index,
  isEdit,
  componentOptions,
  componentOnSearch,
  componentLoading,
  onRemove,
  translate,
}: {
  control: Control<SetVariablesFormData>;
  index: number;
  isEdit: boolean;
  componentOptions: any[];
  componentOnSearch: (value: string) => void;
  componentLoading: boolean;
  onRemove: () => void;
  translate: ReturnType<typeof useTranslate>;
}) => {
  const componentId = useWatch({ control, name: `setVariableData.${index}.componentId` });
  const numericComponentId = typeof componentId === 'number' && componentId > 0 ? componentId : 0;

  const {
    options: variableOptions,
    onSearch: variableOnSearch,
    query: variableQuery,
  } = useSelect({
    resource: ResourceType.VARIABLES,
    optionLabel: 'name',
    optionValue: 'name',
    meta: {
      gqlQuery: VARIABLE_LIST_BY_COMPONENT_QUERY,
      gqlVariables: numericComponentId
        ? { componentId: numericComponentId, offset: 0, limit: 100, mutability: 'ReadOnly' }
        : undefined,
    },
    pagination: { mode: 'off' },
    queryOptions: { enabled: numericComponentId > 0 },
  });

  return (
    <div className={nestedFormRowFlex}>
      <ComboboxFormField
        control={control}
        label={translate('ChargingStations.getVariablesModal.componentNumber', {
          number: index + 1,
        })}
        name={`setVariableData.${index}.componentId`}
        options={componentOptions}
        onSearch={componentOnSearch}
        placeholder={translate('ChargingStations.getVariablesModal.selectComponent')}
        searchPlaceholder={translate('ChargingStations.getVariablesModal.searchComponents')}
        isLoading={componentLoading}
        allowManualEntry
      />

      <ComboboxFormField
        control={control}
        label={translate('ChargingStations.getVariablesModal.variableNumber', {
          number: index + 1,
        })}
        name={`setVariableData.${index}.variableId`}
        options={variableOptions}
        onSearch={variableOnSearch}
        placeholder={translate('ChargingStations.getVariablesModal.selectVariable')}
        searchPlaceholder={translate('ChargingStations.getVariablesModal.searchVariables')}
        isLoading={variableQuery.isLoading}
        required
        disabled={!componentId || componentId === 0}
        allowManualEntry
      />

      <FormField
        control={control}
        label={translate('ChargingStations.setVariablesModal.valueNumber', {
          number: index + 1,
        })}
        name={`setVariableData.${index}.value`}
      >
        <Input placeholder={translate('ChargingStations.setVariablesModal.valuePlaceholder')} />
      </FormField>

      <SelectFormField
        control={control}
        label={translate('ChargingStations.getVariablesModal.attributeTypeNumber', {
          number: index + 1,
        })}
        name={`setVariableData.${index}.attributeType`}
        options={attributeTypes}
        placeholder={translate('ChargingStations.getVariablesModal.selectAttributeType')}
      />

      {!isEdit && <RemoveArrayItemButton onRemoveAction={onRemove} />}
    </div>
  );
};

export const SetVariablesModal = ({ station, defaultSetVariable }: SetVariablesModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const isEdit = !!defaultSetVariable;
  const [loading, setLoading] = useState(false);

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
        defaultSetVariable
          ? {
              componentId: defaultSetVariable.componentName ?? '',
              variableId: defaultSetVariable.variableName ?? '',
              value: defaultSetVariable.value ?? '',
              attributeType: defaultSetVariable.attributeType as
                | OCPP2_0_1.AttributeEnumType
                | undefined,
            }
          : {
              componentId: 0,
              variableId: 0,
              value: '',
              attributeType: undefined,
            },
      ],
    },
  });

  useEffect(() => {
    if (defaultSetVariable) {
      form.reset({
        setVariableData: [
          {
            componentId: defaultSetVariable.componentName ?? '',
            variableId: defaultSetVariable.variableName ?? '',
            value: defaultSetVariable.value ?? '',
            attributeType: defaultSetVariable.attributeType as
              | OCPP2_0_1.AttributeEnumType
              | undefined,
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSetVariable]);

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

  const onFinish = async (values: SetVariablesFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Set Variables request because station ID is missing.');
      return;
    }

    const setVariableData = values.setVariableData.map((item) => {
      const componentName =
        typeof item.componentId === 'string'
          ? item.componentId
          : (componentOptions.find((c) => c.value === item.componentId) as any)?.label || '';

      // The variable combobox stores the name (optionValue: 'name'), so use it directly.
      const variableName = typeof item.variableId === 'string' ? item.variableId : '';

      const componentInstance =
        defaultSetVariable?.componentName === componentName
          ? defaultSetVariable?.componentInstance
          : undefined;
      const variableInstance =
        defaultSetVariable?.variableName === variableName
          ? defaultSetVariable?.variableInstance
          : undefined;

      return {
        component: {
          name: componentName,
          ...(componentInstance ? { instance: componentInstance } : {}),
        },
        variable: {
          name: variableName,
          ...(variableInstance ? { instance: variableInstance } : {}),
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
      {!isEdit && (
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
      )}
      <div className="flex flex-col gap-6 w-full">
        {fields.map((field, index) => (
          <SetVariableRow
            key={field.id}
            control={form.control}
            index={index}
            isEdit={isEdit}
            componentOptions={componentOptions}
            componentOnSearch={componentOnSearch}
            componentLoading={componentQuery.isLoading}
            onRemove={() => remove(index)}
            translate={translate}
          />
        ))}
      </div>
    </Form>
  );
};
