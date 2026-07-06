// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { AuthorizationDto, ChargingStationDto } from '@citrineos/base';
import { AuthorizationProps, BaseProps, OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { ComboboxFormField, FormField } from '@lib/client/components/form/field';
import { ConnectorSelector } from '@lib/client/components/modals/shared/connector-selector/connector.selector';
import { Input } from '@lib/client/components/ui/input';
import { AUTHORIZATIONS_LIST_QUERY } from '@lib/queries/authorizations';
import { ResourceType } from '@lib/utils/access.types';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useSelect, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { Controller } from 'react-hook-form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface OCPP1_6_RemoteStartProps {
  station: ChargingStationDto;
}

type RemoteStartFormData = {
  remoteStartId: number;
  idTag: string;
  connectorId?: number;
};

export const OCPP1_6_RemoteStart = ({ station }: OCPP1_6_RemoteStartProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const RemoteStartSchema = useMemo(
    () =>
      z.object({
        remoteStartId: z.coerce
          .number<number>()
          .min(0, translate('ChargingStations.remoteStartModal.remoteStartIdMin')),
        idTag: z.string().min(1, translate('ChargingStations.remoteStartModal.idTokenRequired')),
        connectorId: z.number().optional(),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(RemoteStartSchema),
    defaultValues: {
      remoteStartId: 0,
      idTag: '',
      connectorId: undefined,
    },
  });

  const {
    options: authorizationOptions,
    onSearch: authorizationOnSearch,
    query: authorizationQueryResult,
  } = useSelect<AuthorizationDto>({
    resource: ResourceType.AUTHORIZATIONS,
    optionLabel: 'idToken',
    optionValue: 'idToken',
    meta: {
      gqlQuery: AUTHORIZATIONS_LIST_QUERY,
      gqlVariables: { offset: 0, limit: 10 },
    },
    sorters: [{ field: BaseProps.updatedAt, order: 'desc' }],
    pagination: { mode: 'off' },
    onSearch: (value: string) => [
      {
        operator: 'or',
        value: [
          {
            field: AuthorizationProps.idToken,
            operator: 'contains',
            value,
          },
        ],
      },
    ],
  });

  const handleIdTokenSelection = (value: string) => {
    form.setValue('idTag', value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleConnectorSelection = (value: any) => {
    form.setValue('connectorId', Number(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onFinish = (values: RemoteStartFormData) => {
    const data = {
      connectorId: values.connectorId,
      idTag: values.idTag,
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/evdriver/remoteStartTransaction?identifier=${station.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      ocppVersion: OCPPVersion.OCPP1_6,
      setLoading,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  return (
    <Form
      {...form}
      loading={loading || authorizationQueryResult.isLoading}
      submitHandler={onFinish}
      hideCancel
      submitButtonVariant={FormButtonVariants.confirm}
      submitButtonLabel={translate('ChargingStations.remoteStartModal.start')}
    >
      <FormField
        control={form.control}
        label={translate('ChargingStations.remoteStartModal.remoteStartId')}
        name="remoteStartId"
      >
        <Input type="number" min={0} />
      </FormField>

      <ComboboxFormField
        control={form.control}
        label={translate('ChargingStations.remoteStartModal.idToken')}
        name="idTag"
        options={authorizationOptions}
        onSelect={handleIdTokenSelection}
        onSearch={authorizationOnSearch}
        placeholder={translate('ChargingStations.remoteStartModal.searchIdToken')}
        isLoading={authorizationQueryResult.isLoading}
      />

      <Controller
        control={form.control}
        name="connectorId"
        render={({ field }) => (
          <ConnectorSelector
            station={station}
            value={field.value ?? undefined}
            onSelect={handleConnectorSelection}
            isOptional
          />
        )}
      />
    </Form>
  );
};
