// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type AuthorizationDto, type ChargingStationDto } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckboxFormField, ComboboxFormField, FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { AUTHORIZATIONS_LIST_QUERY } from '@lib/queries/authorizations';
import { ResourceType } from '@lib/utils/access.types';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useSelect, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { Form } from '@lib/client/components/form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface CustomerInformationModalProps {
  station: any;
}

export type CustomerInformationFormData = {
  requestId: number;
  report: boolean;
  clear: boolean;
  customerIdentifier?: string;
  authorization?: string;
};

export const CustomerInformationModal = ({ station }: CustomerInformationModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const CustomerInformationSchema = useMemo(
    () =>
      z.object({
        requestId: z.coerce
          .number<number>()
          .int()
          .positive(translate('ChargingStations.requestId.positiveError')),
        report: z.boolean(),
        clear: z.boolean(),
        customerIdentifier: z.string().optional(),
        authorization: z.string().optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(CustomerInformationSchema),
    defaultValues: {
      requestId: 1,
      report: false,
      clear: false,
      customerIdentifier: '',
      authorization: '',
    },
  });

  const { options, onSearch, query } = useSelect<AuthorizationDto>({
    resource: ResourceType.AUTHORIZATIONS,
    optionLabel: 'idToken',
    optionValue: (auth) => JSON.stringify(auth),
    meta: {
      gqlQuery: AUTHORIZATIONS_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 10,
      },
    },
    pagination: { mode: 'off' },
  });

  const onFinish = (values: CustomerInformationFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Customer Information request because station ID is missing.',
      );
      return;
    }

    const payload: any = {
      requestId: values.requestId,
      report: values.report,
      clear: values.clear,
      customerIdentifier: values.customerIdentifier || undefined,
    };

    if (values.authorization) {
      const authorization = JSON.parse(values.authorization);

      payload.idToken = {
        idToken: authorization.idToken,
        type: authorization.idTokenType,
        additionalInfo: authorization.additionalInfo,
      };
    }

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/reporting/customerInformation?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
      data: payload,
      setLoading,
      ocppVersion: parsedStation.protocol,
    }).then(() => {
      form.reset({
        requestId: 1,
        report: false,
        clear: false,
        customerIdentifier: '',
        authorization: '',
      });

      dispatch(closeModal());
    });
  };

  const handleFormSubmit = form.handleSubmit(onFinish);

  return (
    <Form
      {...form}
      loading={loading}
      submitHandler={handleFormSubmit}
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

      <CheckboxFormField
        control={form.control}
        label={translate('ChargingStations.customerInformationModal.report')}
        name="report"
      />

      <CheckboxFormField
        control={form.control}
        label={translate('ChargingStations.customerInformationModal.clear')}
        name="clear"
      />

      <FormField
        control={form.control}
        label={translate('ChargingStations.customerInformationModal.customerIdentifier')}
        name="customerIdentifier"
      >
        <Input
          placeholder={translate(
            'ChargingStations.customerInformationModal.customerIdentifierPlaceholder',
          )}
        />
      </FormField>

      <ComboboxFormField
        control={form.control}
        name="authorization"
        label={translate('ChargingStations.remoteStartModal.authorization')}
        options={options}
        onSearch={onSearch}
        placeholder={translate('ChargingStations.remoteStartModal.searchAuthorizations')}
        isLoading={query.isLoading}
      />
    </Form>
  );
};
