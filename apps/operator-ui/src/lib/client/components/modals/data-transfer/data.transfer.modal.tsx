// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { Textarea } from '@lib/client/components/ui/textarea';
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

export interface DataTransferModalProps {
  station: any;
}

type DataTransferFormData = {
  vendorId: string;
  messageId?: string;
  data?: string;
};

export const DataTransferModal = ({ station }: DataTransferModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const ocppVersion = parsedStation.protocol;

  const DataTransferSchema = useMemo(
    () =>
      z.object({
        vendorId: z
          .string()
          .min(1, translate('ChargingStations.dataTransferModal.vendorIdRequired')),
        messageId: z.string().optional(),
        data: z.string().optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(DataTransferSchema),
    defaultValues: {
      vendorId: '',
      messageId: '',
      data: '',
    },
  });

  const handleSubmit = (values: DataTransferFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Data Transfer request because station ID is missing.');
      return;
    }

    const data: Record<string, unknown> = {
      vendorId: values.vendorId,
    };

    if (values.messageId) {
      data.messageId = values.messageId;
    }

    if (values.data) {
      data.data = values.data;
    }

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/configuration/dataTransfer?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion,
    }).then(() => {
      form.reset({
        vendorId: '',
        messageId: '',
        data: '',
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
        label={translate('ChargingStations.dataTransferModal.vendorId')}
        name="vendorId"
        required
      >
        <Input placeholder={translate('ChargingStations.dataTransferModal.vendorIdPlaceholder')} />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.dataTransferModal.messageId')}
        name="messageId"
      >
        <Input placeholder={translate('ChargingStations.dataTransferModal.messageIdPlaceholder')} />
      </FormField>

      <FormField
        control={form.control}
        label={translate('ChargingStations.dataTransferModal.data')}
        name="data"
      >
        <Textarea placeholder={translate('ChargingStations.dataTransferModal.dataPlaceholder')} />
      </FormField>
    </Form>
  );
};
