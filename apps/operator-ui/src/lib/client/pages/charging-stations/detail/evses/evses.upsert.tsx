// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import type { EvseDto } from '@citrineos/base';
import { EvseProps } from '@citrineos/base';
import { Form } from '@lib/client/components/form';
import { CheckboxFormField, FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { EvseClass } from '@lib/cls/evse.dto';
import { EVSE_CREATE_MUTATION, EVSE_EDIT_MUTATION } from '@lib/queries/evses';
import { ResourceType } from '@lib/utils/access.types';
import { getSerializedValues } from '@lib/utils/middleware';
import { useForm } from '@refinedev/react-hook-form';
import { evsesFormUpsertGrid } from '@lib/client/pages/charging-stations/detail/evses/evses.list';
import { useTenantId } from '@lib/client/hooks/useTenantId';
import { useTranslate } from '@refinedev/core';

interface EvseUpsertProps {
  onSubmit: () => void;
  stationId: number;
  ocppConnectionName?: string;
  evse: EvseDto | null;
}

export const EvseUpsert: React.FC<EvseUpsertProps> = ({
  onSubmit,
  stationId,
  ocppConnectionName,
  evse,
}) => {
  const translate = useTranslate();
  const tenantId = useTenantId();

  const form = useForm({
    refineCoreProps: {
      resource: ResourceType.EVSES,
      id: evse?.id,
      redirect: false,
      action: evse ? 'edit' : 'create',
      mutationMode: 'pessimistic',
      meta: {
        gqlMutation: evse ? EVSE_EDIT_MUTATION : EVSE_CREATE_MUTATION,
      },
      onMutationSuccess: () => {
        onSubmit();
      },
    },
    defaultValues: {
      evseTypeId: evse?.evseTypeId || 0,
      evseId: evse?.evseId || '',
      physicalReference: evse?.physicalReference || '',
      removed: evse?.removed || false,
    },
  });

  const reset = () => {
    form.reset({
      evseTypeId: 0,
      evseId: '',
      physicalReference: '',
      removed: false,
    });
  };

  const handleOnFinish = (data: any) => {
    const now = new Date().toISOString();

    const newItem = getSerializedValues(data, EvseClass);

    if (!newItem.id) {
      newItem.tenantId = tenantId;
      newItem.createdAt = now;
    }

    newItem.updatedAt = now;
    newItem.stationId = stationId;
    newItem.ocppConnectionName = ocppConnectionName ?? evse?.ocppConnectionName;

    form.refineCore.onFinish(newItem).then(() => reset());
  };

  return (
    <Form {...form} submitHandler={handleOnFinish} hideCancel>
      <div className={evsesFormUpsertGrid}>
        <FormField
          control={form.control}
          name={EvseProps.evseTypeId}
          label={translate('ChargingStations.evses.evseTypeId')}
          description={translate('ChargingStations.evses.evseTypeIdDescription')}
          required
        >
          <Input type="number" />
        </FormField>

        <FormField
          control={form.control}
          name={EvseProps.evseId}
          label={translate('ChargingStations.evses.evseId')}
          description={translate('ChargingStations.evses.evseIdDescription')}
          required
        >
          <Input />
        </FormField>

        <FormField
          control={form.control}
          name={EvseProps.physicalReference}
          label={translate('ChargingStations.evses.physicalReference')}
          description={translate('ChargingStations.evses.physicalReferenceDescription')}
        >
          <Input />
        </FormField>

        <CheckboxFormField
          control={form.control}
          name={EvseProps.removed}
          label={translate('ChargingStations.evses.removed')}
          description={translate('ChargingStations.evses.removedDescription')}
        />
      </div>
    </Form>
  );
};
