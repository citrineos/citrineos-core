// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPP2_0_1 } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { SelectFormField } from '@lib/client/components/form/field';
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

interface GetLogsModalProps {
  station: any;
}

type GetLogsFormData = {
  requestId: number;
  remoteLocation: string;
  oldestTimestamp?: string;
  latestTimestamp?: string;
  logType: OCPP2_0_1.LogEnumType;
  retries?: number;
  retryInterval?: number;
};

const logTypes = Object.keys(OCPP2_0_1.LogEnumType);

export const GetLogsModal = ({ station }: GetLogsModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const remoteLocation = 'http://localhost:4566/citrineos-s3-bucket/';

  const GetLogsSchema = useMemo(
    () =>
      z.object({
        requestId: z.coerce
          .number<number>()
          .int()
          .positive(translate('ChargingStations.requestId.positiveError')),
        remoteLocation: z
          .url(translate('ChargingStations.firmwareDiagnostics.invalidUrl'))
          .min(1, translate('ChargingStations.getLogsModal.remoteLocationRequired'))
          .max(512),
        oldestTimestamp: z.string().min(1).optional(),
        latestTimestamp: z.string().min(1).optional(),
        logType: z.enum(OCPP2_0_1.LogEnumType, {
          message: translate('ChargingStations.getLogsModal.logTypeRequired'),
        }),
        retries: z.coerce.number<number>().int().min(0).optional(),
        retryInterval: z.coerce.number<number>().int().min(0).optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(GetLogsSchema),
    defaultValues: {
      logType: OCPP2_0_1.LogEnumType.DiagnosticsLog,
      remoteLocation,
    },
  });

  const onFinish = async (values: GetLogsFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Get Logs request because station ID is missing.');
      return;
    }

    const data = {
      log: {
        remoteLocation: values.remoteLocation,
        oldestTimestamp: values.oldestTimestamp
          ? new Date(values.oldestTimestamp).toISOString()
          : undefined,
        latestTimestamp: values.latestTimestamp
          ? new Date(values.latestTimestamp).toISOString()
          : undefined,
      },
      logType: values.logType,
      requestId: values.requestId,
      ...(values.retries !== undefined && { retries: values.retries }),
      ...(values.retryInterval !== undefined && {
        retryInterval: values.retryInterval,
      }),
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/reporting/getLog?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
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
      submitHandler={onFinish}
      loading={loading}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <FormField
        control={form.control}
        label={translate('ChargingStations.requestId.label')}
        name="requestId"
        required
      >
        <Input type="number" placeholder={translate('ChargingStations.requestId.placeholder')} />
      </FormField>
      <FormField
        control={form.control}
        label={translate('ChargingStations.getLogsModal.remoteLocationUrl')}
        name="remoteLocation"
        required
      >
        <Input placeholder={remoteLocation} type="url" />
      </FormField>
      <SelectFormField
        control={form.control}
        label={translate('ChargingStations.getLogsModal.logType')}
        name="logType"
        options={logTypes}
        placeholder={translate('ChargingStations.getLogsModal.selectLogType')}
        required
      />
      <FormField
        control={form.control}
        label={translate('ChargingStations.getLogsModal.oldestTimestamp')}
        name="oldestTimestamp"
      >
        <Input type="datetime-local" />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.getLogsModal.latestTimestamp')}
        name="latestTimestamp"
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
