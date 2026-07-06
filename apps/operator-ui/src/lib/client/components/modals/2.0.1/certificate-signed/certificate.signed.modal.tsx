// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPP2_0_1 } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, SelectFormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { readFileContent, triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { Form } from '@lib/client/components/form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface CertificateSignedModalProps {
  station: any;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['.pem', '.id'];

const certificateSigningUses = Object.keys(OCPP2_0_1.CertificateSigningUseEnumType);

export type CertificateSignedFormData = {
  certificateType?: OCPP2_0_1.CertificateSigningUseEnumType;
  certificate: FileList;
};

export const CertificateSignedModal = ({ station }: CertificateSignedModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const CertificateSignedSchema = useMemo(
    () =>
      z.object({
        certificateType: z.enum(OCPP2_0_1.CertificateSigningUseEnumType).optional(),
        certificate: z
          .custom<FileList>()
          .refine(
            (files) => files?.length === 1,
            translate('ChargingStations.certificateSignedModal.certificateRequired'),
          )
          .refine(
            (files) => {
              const file = files?.[0];
              if (!file) return false;
              const extension = '.' + file.name.split('.').pop()?.toLowerCase();
              return ACCEPTED_FILE_TYPES.includes(extension);
            },
            translate('ChargingStations.certificateSignedModal.fileTypeError', {
              types: ACCEPTED_FILE_TYPES.join(', '),
            }),
          )
          .refine(
            (files) => files?.[0]?.size <= MAX_FILE_SIZE,
            translate('ChargingStations.certificateSignedModal.fileSizeError'),
          ),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(CertificateSignedSchema),
    defaultValues: {
      certificateType: undefined,
      certificate: undefined,
    },
  });

  const fileRef = form.register('certificate');

  const onFinish = (values: CertificateSignedFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Certificate Signed request because station ID is missing.',
      );
      return;
    }

    const file = values.certificate[0];
    readFileContent(file)
      .then((fileContent) => {
        const data = {
          certificateType: values.certificateType,
          certificateChain: fileContent,
        };

        triggerMessageAndHandleResponse<MessageConfirmation[]>({
          translate,
          url: `/certificates/certificateSigned?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
          data,
          setLoading,
          ocppVersion: parsedStation.protocol,
        }).then(() => {
          form.reset({
            certificateType: undefined,
            certificate: undefined,
          });
          dispatch(closeModal());
        });
      })
      .catch((err) => console.error('Error during submission:', err));
  };

  const handleFormSubmit = form.handleSubmit(onFinish);

  return (
    <Form
      {...form}
      submitHandler={handleFormSubmit}
      loading={loading}
      submitButtonVariant={FormButtonVariants.submit}
      hideCancel
    >
      <FormField
        control={form.control}
        label={translate('ChargingStations.certificateSignedModal.certificateFile')}
        name="certificate"
        required
      >
        <Input type="file" accept={ACCEPTED_FILE_TYPES.join(',')} {...fileRef} />
      </FormField>

      <SelectFormField
        control={form.control}
        label={translate('ChargingStations.certificateSignedModal.certificateType')}
        name="certificateType"
        options={certificateSigningUses}
        placeholder={translate('ChargingStations.certificateSignedModal.selectCertificateType')}
      />
    </Form>
  );
};
