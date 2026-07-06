// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type TariffDto, TariffProps, TariffSchema } from '@citrineos/base';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { TariffClass } from '@lib/cls/tariff.dto';
import {
  TARIFF_CREATE_MUTATION,
  TARIFF_EDIT_MUTATION,
  TARIFF_GET_QUERY,
} from '@lib/queries/tariffs';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { getSerializedValues } from '@lib/utils/middleware';
import { CanAccess, type GetOneResponse, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import React from 'react';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Textarea } from '@lib/client/components/ui/textarea';
import { useTenantId } from '@lib/client/hooks/useTenantId';

type TariffUpsertProps = {
  params: { id?: string };
};

const TariffFormSchema = TariffSchema.pick({
  [TariffProps.currency]: true,
  [TariffProps.tariffAltText]: true,
}).extend({
  [TariffProps.pricePerKwh]: z.coerce.number().min(0),
  [TariffProps.pricePerMin]: z.coerce.number().min(0).nullable().optional(),
  [TariffProps.pricePerSession]: z.coerce.number().min(0).nullable().optional(),
  [TariffProps.authorizationAmount]: z.coerce.number().min(0).nullable().optional(),
  [TariffProps.paymentFee]: z.coerce.number().min(0).nullable().optional(),
  [TariffProps.taxRate]: z.coerce.number().min(0).nullable().optional(),
});

const defaultValues = {
  [TariffProps.currency]: '',
  [TariffProps.pricePerKwh]: 0,
  [TariffProps.pricePerMin]: undefined,
  [TariffProps.pricePerSession]: undefined,
  [TariffProps.authorizationAmount]: undefined,
  [TariffProps.paymentFee]: undefined,
  [TariffProps.taxRate]: undefined,
  [TariffProps.tariffAltText]: undefined,
};

export const TariffUpsert = ({ params }: TariffUpsertProps) => {
  const { id } = params;
  const { back } = useRouter();
  const translate = useTranslate();

  const tenantId = useTenantId();

  const form = useForm({
    refineCoreProps: {
      resource: ResourceType.TARIFFS,
      redirect: 'list',
      queryOptions: {
        enabled: !!id,
        select: (data: GetOneResponse<TariffDto>) => {
          const formData = {
            ...data.data,
            tariffAltText: data.data?.tariffAltText
              ? JSON.stringify(data.data.tariffAltText, null, 2)
              : '',
          };
          return { ...data, data: formData };
        },
      },
      mutationMode: 'pessimistic',
      action: id ? 'edit' : 'create',
      liveMode: 'auto',
      meta: {
        gqlQuery: TARIFF_GET_QUERY,
        gqlMutation: id ? TARIFF_EDIT_MUTATION : TARIFF_CREATE_MUTATION,
      },
    },
    defaultValues: { ...defaultValues },
    resolver: zodResolver(TariffFormSchema),
    warnWhenUnsavedChanges: true,
  });

  const handleOnFinish = async (values: any) => {
    const now = new Date().toISOString();
    const newItem: any = getSerializedValues(values, TariffClass);

    // Parse tariffAltText JSON string back to object
    if (typeof newItem.tariffAltText === 'string') {
      try {
        newItem.tariffAltText = newItem.tariffAltText ? JSON.parse(newItem.tariffAltText) : null;
      } catch {
        newItem.tariffAltText = null;
      }
    }

    // Convert empty strings/null to undefined for optional fields
    const optionalNumericFields = [
      TariffProps.pricePerMin,
      TariffProps.pricePerSession,
      TariffProps.authorizationAmount,
      TariffProps.paymentFee,
      TariffProps.taxRate,
    ];
    for (const field of optionalNumericFields) {
      if (newItem[field] === '' || newItem[field] === null) {
        newItem[field] = undefined;
      }
    }

    if (!id) {
      newItem.tenantId = tenantId;
      newItem.createdAt = now;
    }
    newItem.updatedAt = now;

    form.refineCore.onFinish?.(newItem);
  };

  return (
    <CanAccess
      resource={ResourceType.TARIFFS}
      action={ActionType.EDIT}
      fallback={<AccessDeniedFallback />}
      params={{ id }}
    >
      <Card className={pageMargin}>
        <CardHeader>
          <div className={cardHeaderFlex}>
            <ChevronLeft onClick={() => back()} className="cursor-pointer" />
            <h2 className={heading2Style}>
              {translate(`actions.${id ? 'edit' : 'create'}`)} {translate('Tariffs.tariff')}
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form} submitHandler={handleOnFinish}>
            <div className={cardGridStyle}>
              <FormField
                control={form.control}
                label={translate('Tariffs.fields.currency')}
                name={TariffProps.currency}
                required
              >
                <Input placeholder={translate('Tariffs.placeholders.currency')} maxLength={3} />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.pricePerKwh')}
                name={TariffProps.pricePerKwh}
                required
              >
                <Input type="number" min="0" step="0.01" />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.pricePerMin')}
                name={TariffProps.pricePerMin}
              >
                <Input type="number" min="0" step="0.01" />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.pricePerSession')}
                name={TariffProps.pricePerSession}
              >
                <Input type="number" min="0" step="0.01" />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.authorizationAmount')}
                name={TariffProps.authorizationAmount}
              >
                <Input type="number" min="0" step="0.01" />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.paymentFee')}
                name={TariffProps.paymentFee}
              >
                <Input type="number" min="0" step="0.01" />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.taxRate')}
                name={TariffProps.taxRate}
              >
                <Input type="number" min="0" step="0.0001" />
              </FormField>

              <FormField
                control={form.control}
                label={translate('Tariffs.fields.tariffAltText')}
                name={TariffProps.tariffAltText}
              >
                <Textarea placeholder={translate('Tariffs.placeholders.tariffAltText')} />
              </FormField>
            </div>
          </Form>
        </CardContent>
      </Card>
    </CanAccess>
  );
};
