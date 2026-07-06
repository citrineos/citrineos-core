// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import {
  type ChargingStationDto,
  type InstalledCertificateDto,
  InstalledCertificateProps,
} from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { ComboboxFormField } from '@lib/client/components/form/field';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { INSTALLED_CERTIFICATE_LIST_QUERY } from '@lib/queries/installed.certificates';
import { ResourceType } from '@lib/utils/access.types';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useSelect, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import z from 'zod';
import { Form } from '@lib/client/components/form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface DeleteCertificateModalProps {
  station: any;
}

export type DeleteCertificateFormData = {
  certificate: string;
};

export const DeleteCertificateModal = ({ station }: DeleteCertificateModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const DeleteCertificateSchema = useMemo(
    () =>
      z.object({
        certificate: z
          .string()
          .min(1, translate('ChargingStations.deleteCertificateModal.certificateRequired')),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(DeleteCertificateSchema),
    defaultValues: {
      certificate: '',
    },
  });

  const { options, onSearch, query } = useSelect<InstalledCertificateDto>({
    resource: ResourceType.INSTALLED_CERTIFICATES,
    optionLabel: 'serialNumber',
    optionValue: (cert) => JSON.stringify(cert),
    meta: {
      gqlQuery: INSTALLED_CERTIFICATE_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 10,
      },
    },
    filters: [
      {
        field: InstalledCertificateProps.ocppConnectionName,
        operator: 'eq',
        value: parsedStation.ocppConnectionName,
      },
    ],
    pagination: { mode: 'off' },
  });

  const selectedCertificate = form.watch('certificate');

  const onFinish = async (values: DeleteCertificateFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Delete Certificate request because station ID is missing.',
      );
      return;
    }

    if (!values.certificate) {
      toast.error(translate('ChargingStations.deleteCertificateModal.selectCertificateError'));
      return;
    }

    const certificate = JSON.parse(values.certificate);

    if (parsedStation.ocppConnectionName !== certificate.ocppConnectionName) {
      toast.error(translate('ChargingStations.deleteCertificateModal.wrongStationError'));
      return;
    }

    const data = {
      certificateHashData: {
        hashAlgorithm: certificate.hashAlgorithm,
        issuerNameHash: certificate.issuerNameHash,
        issuerKeyHash: certificate.issuerKeyHash,
        serialNumber: certificate.serialNumber,
      },
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/certificates/deleteCertificate?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      setLoading,
      ocppVersion: parsedStation.protocol,
    }).then(() => {
      form.reset({
        certificate: '',
      });
      dispatch(closeModal());
    });
  };

  const renderCertificateInformation = (stringifiedCertificate: string) => {
    if (!stringifiedCertificate) {
      return <></>;
    }

    const certificate = JSON.parse(stringifiedCertificate);

    return (
      <div className="flex flex-col gap-2 rounded-md bg-muted p-4 text-sm">
        <span>
          <span className="font-semibold">
            {translate('ChargingStations.deleteCertificateModal.hashAlgorithm')}
          </span>{' '}
          {certificate.hashAlgorithm}
        </span>
      </div>
    );
  };

  return (
    <Form
      {...form}
      submitHandler={onFinish}
      loading={loading}
      submitButtonVariant={FormButtonVariants.delete}
      submitButtonLabel={translate('ChargingStations.commands.deleteCertificate')}
      hideCancel
    >
      <ComboboxFormField
        control={form.control}
        name="certificate"
        label={translate('ChargingStations.deleteCertificateModal.installedCertificate')}
        options={options}
        onSearch={onSearch}
        placeholder={translate('ChargingStations.deleteCertificateModal.searchCertificates')}
        isLoading={query.isLoading}
        required
      />

      {renderCertificateInformation(selectedCertificate)}
    </Form>
  );
};
