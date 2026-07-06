// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Form } from '@lib/client/components/form';
import { FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

interface GetDiagnosticsModalProps {
  station: any;
}

type GetDiagnosticsFormData = {
  location: string;
  startTime?: string;
  stopTime?: string;
  retries?: number;
  retryInterval?: number;
};

export const GetDiagnosticsModal = ({ station }: GetDiagnosticsModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const location = 'http://localhost:4566/citrineos-s3-bucket/';

  const GetDiagnosticsSchema = useMemo(
    () =>
      z.object({
        location: z
          .url(translate('ChargingStations.firmwareDiagnostics.invalidUrl'))
          .min(1, translate('ChargingStations.firmwareDiagnostics.locationRequired'))
          .max(512),
        startTime: z.string().min(1).optional(),
        stopTime: z.string().min(1).optional(),
        retries: z.coerce.number<number>().int().min(0).optional(),
        retryInterval: z.coerce.number<number>().int().min(0).optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(GetDiagnosticsSchema),
    defaultValues: {
      location,
    },
  });

  const onFinish = async (values: GetDiagnosticsFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Get Logs request because station ID is missing.');
      return;
    }

    const data = {
      location: values.location,
      startTime: values.startTime ? new Date(values.startTime).toISOString() : undefined,
      stopTime: values.stopTime ? new Date(values.stopTime).toISOString() : undefined,
      ...(values.retries !== undefined && { retries: values.retries }),
      ...(values.retryInterval !== undefined && {
        retryInterval: values.retryInterval,
      }),
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/reporting/getDiagnostics?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
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
      submitHandler={onFinish}
      loading={loading}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <FormField
        control={form.control}
        label={translate('ChargingStations.firmwareDiagnostics.locationUrl')}
        name="location"
        required
      >
        <Input placeholder={location} type="url" />
      </FormField>
      <FormField
        control={form.control}
        label={translate('ChargingStations.getDiagnosticsModal.startTimestamp')}
        name="startTime"
      >
        <Input type="datetime-local" />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.getDiagnosticsModal.stopTimestamp')}
        name="stopTime"
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
