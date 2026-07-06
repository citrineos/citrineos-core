// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useMemo, useState } from 'react';
import { type ChargingStationDto, OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField, nestedFormRowFlex } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { AddArrayItemButton } from '@lib/client/components/form/add-array-item-button';
import { RemoveArrayItemButton } from '@lib/client/components/form/remove-array-item-button';
import { useFieldArray } from 'react-hook-form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';
import { useTranslate } from '@refinedev/core';

export interface GetConfigurationModalProps {
  station: any;
}

export const GetConfigurationSchema = z.object({
  configurationKeys: z
    .array(
      z.object({
        configKey: z.string(),
      }),
    ) // an array of objects to allow react-hook-form useFieldArray to work
    .optional(),
});

export type GetConfigurationFormData = z.infer<typeof GetConfigurationSchema>;

export const GetConfigurationModal = ({ station }: GetConfigurationModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const form = useForm({
    resolver: zodResolver(GetConfigurationSchema),
    defaultValues: {
      configurationKeys: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'configurationKeys',
  });

  const handleSubmit = (values: GetConfigurationFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Get Configuration request because station ID is missing.',
      );
      return;
    }

    const keys =
      values.configurationKeys && values.configurationKeys.length > 0
        ? [...new Set(values.configurationKeys.map((ck) => ck.configKey))]
        : null;

    const data: any = {};

    if (keys) {
      data.key = keys;
    }

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/getConfiguration?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
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
      <div className="text-sm text-muted-foreground">
        {translate('ChargingStations.getConfigurationModal.description')}
      </div>

      <AddArrayItemButton
        onAppendAction={() =>
          append({
            configKey: '',
          })
        }
        itemLabel={translate('ChargingStations.getConfigurationModal.key')}
      />
      {fields.map((field, index) => (
        <div key={field.id} className={nestedFormRowFlex}>
          <FormField
            control={form.control}
            label={translate('ChargingStations.getConfigurationModal.keyNumber', {
              number: index + 1,
            })}
            name={`configurationKeys.${index}.configKey`}
          >
            <Input
              placeholder={translate('ChargingStations.getConfigurationModal.keyPlaceholder')}
            />
          </FormField>

          <RemoveArrayItemButton onRemoveAction={() => remove(index)} />
        </div>
      ))}
    </Form>
  );
};
