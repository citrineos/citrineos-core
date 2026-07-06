// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { CHARGING_STATION_SEQUENCES_GET_QUERY } from '@lib/queries/charging.station.sequences';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { formatPem, triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useApiUrl, useCustom, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import z from 'zod';
import { Textarea } from '@lib/client/components/ui/textarea';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface UpdateFirmwareModalProps {
  station: ChargingStationDto;
}

type UpdateFirmwareFormData = {
  requestId: number;
  retries?: number;
  retryInterval?: number;
  location: string;
  retrieveDateTime: string;
  installDateTime?: string;
  signingCertificate?: string;
  signature?: string;
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
        requestId: z.coerce.number<number>().int().min(0),
        retries: z.coerce.number<number>().int().min(0).optional(),
        retryInterval: z.coerce.number<number>().int().min(0).optional(),
        location: z
          .string()
          .url(translate('ChargingStations.firmwareDiagnostics.invalidUrl'))
          .min(1)
          .max(512),
        retrieveDateTime: z
          .string()
          .min(1, translate('ChargingStations.updateFirmwareModal.retrieveDateRequired')),
        installDateTime: z.string().optional(),
        signingCertificate: z.string().max(5500).optional(),
        signature: z.string().max(800).optional(),
      }),
    [translate],
  );

  const apiUrl = useApiUrl();
  const {
    query: { data: requestIdResponse, isLoading: isRequestIdLoading },
  } = useCustom({
    url: `${apiUrl}`,
    method: 'post',
    config: { headers: { 'Content-Type': 'application/json' } },
    meta: {
      operation: 'ChargingStationSequencesGet',
      gqlQuery: CHARGING_STATION_SEQUENCES_GET_QUERY,
      gqlVariables: { stationId: station.id, type: 'updateFirmware' },
    },
  });

  const form = useForm({
    resolver: zodResolver(UpdateFirmwareSchema),
    defaultValues: {
      requestId: 0,
      retries: undefined,
      retryInterval: undefined,
      location: '',
      retrieveDateTime: '',
      installDateTime: '',
      signingCertificate: '',
      signature: '',
    },
  });

  useEffect(() => {
    if (requestIdResponse?.data?.ChargingStationSequences?.[0]?.value) {
      form.setValue('requestId', requestIdResponse.data.ChargingStationSequences[0].value);
    }
  }, [requestIdResponse, form]);

  const handleSubmit = (values: UpdateFirmwareFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Update Firmware request because station ID is missing.');
      return;
    }

    let signingCertificate: string | undefined;
    if (values.signingCertificate && values.signingCertificate.trim()) {
      const pemString = formatPem(values.signingCertificate);
      if (!pemString) {
        toast.error(translate('ChargingStations.installCertificateModal.invalidPem'));
        return;
      }
      signingCertificate = pemString;
    }

    const data = {
      requestId: values.requestId,
      ...(values.retries !== undefined && { retries: values.retries }),
      ...(values.retryInterval !== undefined && {
        retryInterval: values.retryInterval,
      }),
      firmware: {
        location: values.location,
        retrieveDateTime: new Date(values.retrieveDateTime).toISOString(),
        ...(values.installDateTime && {
          installDateTime: new Date(values.installDateTime).toISOString(),
        }),
        ...(signingCertificate && { signingCertificate }),
        ...(values.signature && { signature: values.signature }),
      },
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/updateFirmware?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
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
      loading={loading || isRequestIdLoading}
      submitHandler={handleSubmit}
      submitButtonVariant={FormButtonVariants.submit}
      submitButtonLabel={translate('ChargingStations.commands.updateFirmware')}
      hideCancel
    >
      <FormField
        control={form.control}
        label={translate('ChargingStations.requestId.label')}
        name="requestId"
        required
      >
        <Input type="number" placeholder={translate('ChargingStations.requestId.label')} min="0" />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.firmwareDiagnostics.locationUrl')}
        name="location"
        required
      >
        <Input placeholder="https://example.com/firmware.bin" type="url" required />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.updateFirmwareModal.retrieveDateTime')}
        name="retrieveDateTime"
        required
      >
        <Input type="datetime-local" />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.updateFirmwareModal.installDateTime')}
        name="installDateTime"
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

      <FormField
        control={form.control}
        label={translate('ChargingStations.updateFirmwareModal.signingCertificate')}
        name="signingCertificate"
      >
        <Textarea
          placeholder={translate(
            'ChargingStations.updateFirmwareModal.signingCertificatePlaceholder',
          )}
        />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.updateFirmwareModal.signature')}
        name="signature"
      >
        <Input
          placeholder={translate('ChargingStations.updateFirmwareModal.signaturePlaceholder')}
        />
      </FormField>
    </Form>
  );
};
