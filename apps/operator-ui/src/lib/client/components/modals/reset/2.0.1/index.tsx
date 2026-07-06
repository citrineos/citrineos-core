// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPP2_0_1 } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { SelectFormField } from '@lib/client/components/form/field';
import { EvseSelector } from '@lib/client/components/modals/shared/evse-selector/evse.selector';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { Controller } from 'react-hook-form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface OCPP2_0_1_ResetProps {
  station: ChargingStationDto;
}

type ResetFormData = {
  type: OCPP2_0_1.ResetEnumType;
  evse?: string;
};

const resetTypes = Object.keys(OCPP2_0_1.ResetEnumType);

export const OCPP2_0_1_Reset = ({ station }: OCPP2_0_1_ResetProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const ResetSchema = useMemo(
    () =>
      z.object({
        type: z.enum(OCPP2_0_1.ResetEnumType, {
          message: translate('ChargingStations.resetModal.selectResetTypeError'),
        }),
        evse: z.string().optional(), // { id, evseTypeId }
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      type: OCPP2_0_1.ResetEnumType.OnIdle,
      evse: undefined,
    },
  });

  const handleSubmit = (values: ResetFormData) => {
    const parsedEvse = values.evse ? JSON.parse(values.evse) : undefined;

    const data = {
      type: values.type,
      evseId: parsedEvse?.evseTypeId ?? undefined,
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/reset?identifier=${station.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion: station.protocol,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  const handleEvseSelection = (value: string) => {
    form.setValue('evse', value);
  };

  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={handleSubmit}
      hideCancel
      submitButtonVariant={FormButtonVariants.submit}
      submitButtonLabel={translate('ChargingStations.reset')}
    >
      <SelectFormField
        control={form.control}
        label={translate('ChargingStations.resetModal.resetType')}
        name="type"
        options={resetTypes}
        placeholder={translate('ChargingStations.resetModal.selectResetType')}
      />

      <Controller
        control={form.control}
        name="evse"
        render={({ field }) => (
          <EvseSelector
            station={station}
            value={field.value ?? undefined}
            onSelect={handleEvseSelection}
            isOptional
          />
        )}
      />
    </Form>
  );
};
