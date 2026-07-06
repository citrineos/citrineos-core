// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface UpdateFirmwareModalProps {
  station: ChargingStationDto;
}

type UpdateFirmwareFormData = {
  location: string;
  retrieveDate: string;
  retries?: number;
  retryInterval?: number;
};

export const UpdateFirmwareModal = ({ station }: UpdateFirmwareModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const UpdateFirmwareSchema = useMemo(
    () =>
      z.object({
        location: z
          .url(translate('ChargingStations.firmwareDiagnostics.invalidUrl'))
          .min(1, translate('ChargingStations.firmwareDiagnostics.locationRequired'))
          .max(512),
        retrieveDate: z
          .string()
          .min(1, translate('ChargingStations.updateFirmwareModal.retrieveDateRequired')),
        retries: z.coerce.number<number>().int().min(0).optional(),
        retryInterval: z.coerce.number<number>().int().min(0).optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(UpdateFirmwareSchema),
    defaultValues: {
      location: '',
      retrieveDate: '',
      retries: undefined,
      retryInterval: undefined,
    },
  });

  const handleSubmit = (values: UpdateFirmwareFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Update Firmware request because station ID is missing.');
      return;
    }

    const data = {
      location: values.location,
      retrieveDate: new Date(values.retrieveDate).toISOString(),
      ...(values.retries !== undefined && { retries: values.retries }),
      ...(values.retryInterval !== undefined && {
        retryInterval: values.retryInterval,
      }),
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/updateFirmware?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion: OCPPVersion.OCPP1_6,
    }).then(() => {
      form.reset({
        location: '',
        retrieveDate: '',
        retries: undefined,
        retryInterval: undefined,
      });

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
      <FormField
        control={form.control}
        label={translate('ChargingStations.firmwareDiagnostics.locationUrl')}
        name="location"
        required
      >
        <Input placeholder="https://example.com/firmware.bin" type="url" />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.updateFirmwareModal.retrieveDate')}
        name="retrieveDate"
        required
      >
        <Input type="datetime-local" />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.firmwareDiagnostics.retries')}
        name="retries"
      >
        <Input
          type="number"
          placeholder={translate('ChargingStations.firmwareDiagnostics.retriesPlaceholder')}
          min="0"
        />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.firmwareDiagnostics.retryInterval')}
        name="retryInterval"
      >
        <Input
          type="number"
          placeholder={translate('ChargingStations.firmwareDiagnostics.retryIntervalPlaceholder')}
          min="0"
        />
      </FormField>
    </Form>
  );
};
