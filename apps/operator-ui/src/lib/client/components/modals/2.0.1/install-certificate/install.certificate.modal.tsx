// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPP2_0_1 } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField, SelectFormField } from '@lib/client/components/form/field';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { formatPem, triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { Textarea } from '@lib/client/components/ui/textarea';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

interface InstallCertificateModalProps {
  station: any;
}

type InstallCertificateFormData = {
  certificate: string;
  certificateType: OCPP2_0_1.InstallCertificateUseEnumType;
};

const installCertificateTypes = Object.keys(OCPP2_0_1.InstallCertificateUseEnumType);

export const InstallCertificateModal = ({ station }: InstallCertificateModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const InstallCertificateSchema = useMemo(
    () =>
      z.object({
        certificate: z
          .string()
          .min(1, translate('ChargingStations.installCertificateModal.certificateRequired'))
          .max(5500, translate('ChargingStations.installCertificateModal.certificateTooLong')),
        certificateType: z.enum(OCPP2_0_1.InstallCertificateUseEnumType, {
          message: translate('ChargingStations.installCertificateModal.certificateTypeRequired'),
        }),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(InstallCertificateSchema),
    defaultValues: {
      certificate: '',
      certificateType: undefined,
    },
  });

  const handleSubmit = (values: InstallCertificateFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Install Certificate request because station ID is missing.',
      );
      return;
    }

    const pemString = formatPem(values.certificate);
    if (pemString == null) {
      toast.error(translate('ChargingStations.installCertificateModal.invalidPem'));
      return;
    }

    const data = {
      certificate: pemString,
      certificateType: values.certificateType,
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/certificates/installCertificate?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
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
      loading={loading}
      submitHandler={handleSubmit}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <SelectFormField
        control={form.control}
        label={translate('ChargingStations.certificateSignedModal.certificateType')}
        name="certificateType"
        options={installCertificateTypes}
        placeholder={translate('ChargingStations.certificateSignedModal.selectCertificateType')}
        required
      />

      <FormField
        control={form.control}
        label={translate('ChargingStations.installCertificateModal.certificatePem')}
        name="certificate"
        required
      >
        <Textarea />
      </FormField>
    </Form>
  );
};
