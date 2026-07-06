// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/base';
import { OCPP1_6, OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { SelectFormField } from '@lib/client/components/form/field';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface OCPP1_6_ResetProps {
  station: ChargingStationDto;
}

type ResetFormData = {
  type: OCPP1_6.ResetRequestType;
};

const resetTypes = Object.keys(OCPP1_6.ResetRequestType);

export const OCPP1_6_Reset = ({ station }: OCPP1_6_ResetProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const ResetSchema = useMemo(
    () =>
      z.object({
        type: z.enum(OCPP1_6.ResetRequestType, {
          message: translate('ChargingStations.resetModal.selectResetTypeError'),
        }),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      type: undefined,
    },
  });

  const handleSubmit = (values: ResetFormData) => {
    const data = { type: values.type };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/reset?identifier=${station.ocppConnectionName}&tenantId=${tenantId}`,
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
    </Form>
  );
};
