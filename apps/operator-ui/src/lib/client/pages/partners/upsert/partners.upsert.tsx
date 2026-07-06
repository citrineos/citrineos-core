// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { TenantPartnerProps, TenantPartnerSchema } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { FormField, nestedFormRowFlex, SelectFormField } from '@lib/client/components/form/field';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { TenantPartnerClass } from '@lib/cls/tenant.partner.cls';
import {
  PARTNER_CREATE_MUTATION,
  PARTNER_DETAIL_QUERY,
  PARTNER_UPDATE_MUTATION,
} from '@lib/queries/tenant.partners';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { getSerializedValues } from '@lib/utils/middleware';
import { CanAccess, type GetOneResponse, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { ChevronLeft } from 'lucide-react';
import { useFieldArray } from 'react-hook-form';
import z from 'zod';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import React from 'react';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { heading2Style, heading3Style, pageMargin } from '@lib/client/styles/page';
import { useRouter } from 'next/navigation';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { AddArrayItemButton } from '@lib/client/components/form/add-array-item-button';
import { RemoveArrayItemButton } from '@lib/client/components/form/remove-array-item-button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

type PartnersUpsertProps = {
  params: { id?: string };
};

type TranslateFn = (key: string, options?: any) => string;

const createTenantPartnerSchema = (translate: TranslateFn) =>
  TenantPartnerSchema.pick({
    [TenantPartnerProps.countryCode]: true,
    [TenantPartnerProps.partyId]: true,
    [TenantPartnerProps.partnerProfileOCPI]: true,
  }).extend({
    countryCode: z
      .string()
      .min(2, {
        message: translate('TenantPartners.validation.countryCodeLength'),
      })
      .max(2, {
        message: translate('TenantPartners.validation.countryCodeLength'),
      }),
    partyId: z
      .string()
      .min(3, {
        message: translate('TenantPartners.validation.partyIdLength'),
      })
      .max(3, {
        message: translate('TenantPartners.validation.partyIdLength'),
      }),
  });

export type TenantPartnerCreateDto = z.infer<ReturnType<typeof createTenantPartnerSchema>>;

const defaultValues = {
  [TenantPartnerProps.countryCode]: '',
  [TenantPartnerProps.partyId]: '',
  [TenantPartnerProps.partnerProfileOCPI]: {
    credentials: {
      versionsUrl: '',
      token: '',
    },
    version: {
      version: '2.2.1' as any,
    },
    serverCredentials: {
      versionsUrl: '',
      token: '',
    },
  },
};

const ocpiVersions = ['2.2.1'];

export const PartnersUpsert = ({ params }: PartnersUpsertProps) => {
  const { id } = params;
  const { back, replace } = useRouter();
  const translate = useTranslate();

  const tenantId = useTenantId();

  const form = useForm({
    refineCoreProps: {
      resource: ResourceType.PARTNERS,
      queryOptions: {
        select: (data: GetOneResponse<TenantPartnerCreateDto>) => {
          return data;
        },
      },
      mutationMode: 'pessimistic',
      action: id ? 'edit' : 'create',
      successNotification: () => {
        return {
          message: id
            ? translate('TenantPartners.notifications.updateSuccess')
            : translate('TenantPartners.notifications.createSuccess'),
          type: 'success',
        };
      },
      errorNotification: (error) => {
        return {
          message: id
            ? translate('TenantPartners.notifications.updateError', { message: error?.message })
            : translate('TenantPartners.notifications.createError', { message: error?.message }),
          type: 'error',
        };
      },
      meta: {
        gqlQuery: PARTNER_DETAIL_QUERY,
        gqlMutation: id ? PARTNER_UPDATE_MUTATION : PARTNER_CREATE_MUTATION,
      },
    },
    defaultValues: { ...defaultValues },
    resolver: zodResolver(createTenantPartnerSchema(translate)),
    warnWhenUnsavedChanges: true,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'partnerProfileOCPI.roles',
  });

  const handleOnFinish = (values: TenantPartnerCreateDto) => {
    const now = new Date().toISOString();
    const newItem: any = getSerializedValues(values, TenantPartnerClass);

    if (!id) {
      newItem.tenantId = tenantId;
      newItem.createdAt = now;
    }
    newItem.updatedAt = now;

    form.refineCore.onFinish?.(newItem).then((result) => {
      if (result && !id) {
        const newId = (result as any).data?.id;
        if (newId) {
          replace(`/${MenuSection.AUTHORIZATIONS}/${newId}`);
        }
      } else if (id) {
        back();
      }
    });
  };

  const roleOptions = ['CPO', 'EMSP', 'HUB', 'NAP', 'NSP', 'SCSP'];

  return (
    <CanAccess
      resource={ResourceType.PARTNERS}
      action={ActionType.EDIT}
      fallback={<AccessDeniedFallback />}
      params={{ id }}
    >
      <Card className={pageMargin}>
        <CardHeader>
          <div className={cardHeaderFlex}>
            <ChevronLeft onClick={() => back()} className="cursor-pointer" />
            <h2 className={heading2Style}>
              {translate(`actions.${id ? 'edit' : 'create'}`)}{' '}
              {translate('TenantPartners.tenantPartner')}
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form} submitHandler={handleOnFinish}>
            <div className="flex flex-col gap-6">
              <div className={cardGridStyle}>
                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.countryCode')}
                  name={TenantPartnerProps.countryCode}
                  required
                >
                  <Input maxLength={2} />
                </FormField>
                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.partyId')}
                  name={TenantPartnerProps.partyId}
                  required
                >
                  <Input maxLength={3} />
                </FormField>

                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.versionsUrl')}
                  name="partnerProfileOCPI.credentials.versionsUrl"
                >
                  <Input />
                </FormField>
                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.clientToken')}
                  name="partnerProfileOCPI.credentials.token"
                >
                  <Input />
                </FormField>
                <SelectFormField
                  control={form.control}
                  label={translate('TenantPartners.fields.ocpiVersion')}
                  name="partnerProfileOCPI.version.version"
                  options={ocpiVersions}
                  placeholder={translate('TenantPartners.placeholders.selectVersion')}
                />

                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.versionDetailsUrl')}
                  name="partnerProfileOCPI.version.versionDetailsUrl"
                >
                  <Input />
                </FormField>

                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.serverCredentialsVersionsUrl')}
                  name="partnerProfileOCPI.serverCredentials.versionsUrl"
                >
                  <Input />
                </FormField>

                <FormField
                  control={form.control}
                  label={translate('TenantPartners.fields.serverCredentialsToken')}
                  name="partnerProfileOCPI.serverCredentials.token"
                >
                  <Input />
                </FormField>
              </div>
              <div className="flex flex-col gap-4 items-start">
                <h3 className={heading3Style}>{translate('TenantPartners.fields.roles')}</h3>
                <AddArrayItemButton
                  onAppendAction={() =>
                    append({
                      role: 'CPO',
                      businessDetails: { name: '', website: '' },
                    })
                  }
                  itemLabel={translate('TenantPartners.fields.role')}
                />
                <div className="flex flex-col gap-6 w-full">
                  {fields.map((field, index) => (
                    <div className={nestedFormRowFlex} key={field.id}>
                      <SelectFormField
                        control={form.control}
                        label={translate('TenantPartners.fields.role')}
                        name={`partnerProfileOCPI.roles.${index}.role`}
                        options={roleOptions}
                        placeholder={translate('TenantPartners.placeholders.selectRole')}
                      />

                      <FormField
                        control={form.control}
                        label={translate('TenantPartners.fields.businessName')}
                        name={`partnerProfileOCPI.roles.${index}.businessDetails.name`}
                      >
                        <Input
                          placeholder={translate('TenantPartners.placeholders.businessName')}
                        />
                      </FormField>

                      <FormField
                        control={form.control}
                        label={translate('TenantPartners.fields.website')}
                        name={`partnerProfileOCPI.roles.${index}.businessDetails.website`}
                      >
                        <Input placeholder={translate('TenantPartners.placeholders.website')} />
                      </FormField>

                      <RemoveArrayItemButton onRemoveAction={() => remove(index)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </CanAccess>
  );
};
