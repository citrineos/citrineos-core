// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto } from '@citrineos/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { CheckboxFormField, FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerCommandAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';

interface UpdateAuthPasswordModalProps {
  station: any;
}

type UpdateAuthPasswordFormData = {
  password: string;
  alreadySetOnCharger: boolean;
};

export const UpdateAuthPasswordModal = ({ station }: UpdateAuthPasswordModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const UpdateAuthPasswordSchema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .min(1, translate('ChargingStations.updateAuthPasswordModal.passwordRequired')),
        alreadySetOnCharger: z.boolean(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(UpdateAuthPasswordSchema),
    defaultValues: {
      password: '',
      alreadySetOnCharger: false,
    },
  });

  const handleSubmit = (values: UpdateAuthPasswordFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Update Auth Password request because station ID is missing.',
      );
      return;
    }

    const data = {
      password: values.password,
      alreadySetOnCharger: values.alreadySetOnCharger,
      ocppConnectionName: parsedStation.ocppConnectionName,
    };

    triggerCommandAndHandleResponse<MessageConfirmation>({
      translate,
      url: `/setStationPassword`,
      data,
      setLoading,
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
      submitButtonlabel={translate('ChargingStations.updateAuthPasswordModal.updatePassword')}
      hideCancel
    >
      <FormField
        control={form.control}
        label={translate('ChargingStations.updateAuthPasswordModal.password')}
        name="password"
        required
      >
        <Input
          type="password"
          placeholder={translate('ChargingStations.updateAuthPasswordModal.passwordPlaceholder')}
        />
      </FormField>

      <CheckboxFormField
        control={form.control}
        label={translate('ChargingStations.updateAuthPasswordModal.setOnCharger')}
        name="alreadySetOnCharger"
        required
      />
    </Form>
  );
};
