// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPP2_0_1, type ServerNetworkProfileDto } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { Form } from '@lib/client/components/form';
import {
  CheckboxFormField,
  ComboboxFormField,
  formCheckboxStyle,
  FormField,
  formLabelStyle,
  formLabelWrapperStyle,
  SelectFormField,
} from '@lib/client/components/form/field';
import { Checkbox } from '@lib/client/components/ui/checkbox';
import { Field, FieldLabel } from '@lib/client/components/ui/field';
import { Input } from '@lib/client/components/ui/input';
import { Textarea } from '@lib/client/components/ui/textarea';
import { useTenantId } from '@lib/client/hooks/useTenantId';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { SERVER_NETWORK_PROFILE_LIST_QUERY } from '@lib/queries/server.network.profiles';
import { ResourceType } from '@lib/utils/access.types';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useSelect, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import z from 'zod';

export interface SetNetworkProfileModalProps {
  station: any;
}

type SetNetworkProfileFormData = {
  websocketServerConfigId?: string;
  configurationSlot: number;
  connectionData: {
    ocppVersion: OCPP2_0_1.OCPPVersionEnumType;
    ocppTransport: OCPP2_0_1.OCPPTransportEnumType;
    ocppCsmsUrl: string;
    messageTimeout: number;
    securityProfile: number;
    ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType;
    apn?: any;
    vpn?: any;
  };
  includeApn: boolean;
  includeVpn: boolean;
};

const fieldGrid = 'grid grid-cols-3 sm:grid-cols-2 xl:grid-cols-4 gap-6';

const ocppVersions = Object.keys(OCPP2_0_1.OCPPVersionEnumType);
const ocppTransports = Object.keys(OCPP2_0_1.OCPPTransportEnumType);
const ocppInterfaces = Object.keys(OCPP2_0_1.OCPPInterfaceEnumType);
const apnAuthenticationTypes = Object.keys(OCPP2_0_1.APNAuthenticationEnumType);
const vpnTypes = Object.keys(OCPP2_0_1.VPNEnumType);

export const SetNetworkProfileModal = ({ station }: SetNetworkProfileModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const SetNetworkProfileSchema = useMemo(() => {
    const ApnSchema = z.object({
      apn: z
        .string()
        .min(1, translate('ChargingStations.setNetworkProfileModal.apnRequired'))
        .max(512),
      apnUserName: z.string().max(20).optional(),
      apnPassword: z.string().max(20).optional(),
      simPin: z.coerce.number<number>().int().optional(),
      preferredNetwork: z.string().max(6).optional(),
      useOnlyPreferredNetwork: z.boolean().optional(),
      apnAuthentication: z.enum(OCPP2_0_1.APNAuthenticationEnumType, {
        message: translate('ChargingStations.setNetworkProfileModal.apnAuthRequired'),
      }),
    });

    const VpnSchema = z.object({
      server: z
        .string()
        .min(1, translate('ChargingStations.setNetworkProfileModal.serverRequired'))
        .max(512),
      user: z
        .string()
        .min(1, translate('ChargingStations.setNetworkProfileModal.userRequired'))
        .max(20),
      group: z.string().max(20).optional(),
      password: z
        .string()
        .min(1, translate('ChargingStations.setNetworkProfileModal.passwordRequired'))
        .max(20),
      key: z
        .string()
        .min(1, translate('ChargingStations.setNetworkProfileModal.keyRequired'))
        .max(255),
      type: z.enum(OCPP2_0_1.VPNEnumType, {
        message: translate('ChargingStations.setNetworkProfileModal.vpnTypeRequired'),
      }),
    });

    const NetworkConnectionProfileSchema = z.object({
      ocppVersion: z.enum(OCPP2_0_1.OCPPVersionEnumType, {
        message: translate('ChargingStations.setNetworkProfileModal.ocppVersionRequired'),
      }),
      ocppTransport: z.enum(OCPP2_0_1.OCPPTransportEnumType, {
        message: translate('ChargingStations.setNetworkProfileModal.ocppTransportRequired'),
      }),
      ocppCsmsUrl: z
        .string()
        .url(translate('ChargingStations.firmwareDiagnostics.invalidUrl'))
        .min(1, translate('ChargingStations.setNetworkProfileModal.csmsUrlRequired'))
        .max(512),
      messageTimeout: z.coerce
        .number<number>()
        .int()
        .min(0, translate('ChargingStations.setNetworkProfileModal.messageTimeoutPositive')),
      securityProfile: z.coerce
        .number<number>()
        .int()
        .min(0, translate('ChargingStations.setNetworkProfileModal.securityProfilePositive')),
      ocppInterface: z.enum(OCPP2_0_1.OCPPInterfaceEnumType, {
        message: translate('ChargingStations.setNetworkProfileModal.ocppInterfaceRequired'),
      }),
      apn: ApnSchema.optional(),
      vpn: VpnSchema.optional(),
    });

    return z.object({
      websocketServerConfigId: z.string().optional(),
      configurationSlot: z.coerce
        .number<number>()
        .int()
        .min(0, translate('ChargingStations.setNetworkProfileModal.configurationSlotNonNegative')),
      connectionData: NetworkConnectionProfileSchema,
      includeApn: z.boolean(),
      includeVpn: z.boolean(),
    });
  }, [translate]);

  const form = useForm({
    resolver: zodResolver(SetNetworkProfileSchema),
    defaultValues: {
      websocketServerConfigId: undefined,
      configurationSlot: 1,
      connectionData: {
        ocppVersion: OCPP2_0_1.OCPPVersionEnumType.OCPP20,
        ocppTransport: OCPP2_0_1.OCPPTransportEnumType.JSON,
        ocppCsmsUrl: '',
        messageTimeout: 30,
        securityProfile: 0,
        ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType.Wired0,
        apn: undefined,
        vpn: undefined,
      },
      includeApn: false,
      includeVpn: false,
    },
  });

  const {
    options: serverNetworkProfileOptions,
    onSearch: serverNetworkProfileOnSearch,
    query: serverNetworkProfileQuery,
  } = useSelect<ServerNetworkProfileDto>({
    resource: ResourceType.SERVER_NETWORK_PROFILES,
    optionLabel: (item: any) => `${item.host}:${item.port}`,
    optionValue: 'id',
    meta: {
      gqlQuery: SERVER_NETWORK_PROFILE_LIST_QUERY,
      gqlVariables: {
        offset: 0,
        limit: 10,
      },
    },
    pagination: { mode: 'off' },
  });

  const onFinish = (values: SetNetworkProfileFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error(
        'Error: Cannot submit Set Network Profile request because station ID is missing.',
      );
      return;
    }

    // Remove includeApn and includeVpn flags, and clean up connectionData
    const connectionData: any = {
      ocppVersion: values.connectionData.ocppVersion,
      ocppTransport: values.connectionData.ocppTransport,
      ocppCsmsUrl: values.connectionData.ocppCsmsUrl,
      messageTimeout: values.connectionData.messageTimeout,
      securityProfile: values.connectionData.securityProfile,
      ocppInterface: values.connectionData.ocppInterface,
    };

    if (values.includeApn && values.connectionData.apn) {
      connectionData.apn = values.connectionData.apn;
    }

    if (values.includeVpn && values.connectionData.vpn) {
      connectionData.vpn = values.connectionData.vpn;
    }

    const data = {
      configurationSlot: values.configurationSlot,
      connectionData,
    };

    let url = `/configuration/setNetworkProfile?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`;
    if (values.websocketServerConfigId) {
      url = `${url}&websocketServerConfigId=${values.websocketServerConfigId}`;
    }

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url,
      data,
      setLoading,
      ocppVersion: parsedStation.protocol,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  const handleFormSubmit = () => onFinish(form.getValues());

  const includeApn = form.watch('includeApn');
  const includeVpn = form.watch('includeVpn');

  return (
    <Form
      {...form}
      submitHandler={handleFormSubmit}
      loading={loading}
      submitButtonVariant={FormButtonVariants.submit}
      submitButtonLabel={translate('ChargingStations.commands.setNetworkProfile')}
      hideCancel
    >
      <div className={fieldGrid}>
        <ComboboxFormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.websocketServerConfig')}
          name="websocketServerConfigId"
          options={serverNetworkProfileOptions}
          onSearch={serverNetworkProfileOnSearch}
          placeholder={translate('ChargingStations.setNetworkProfileModal.searchServerProfiles')}
          isLoading={serverNetworkProfileQuery.isLoading}
        />

        <FormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.configurationSlot')}
          name="configurationSlot"
        >
          <Input type="number" min="0" />
        </FormField>

        <SelectFormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.ocppVersion')}
          name="connectionData.ocppVersion"
          options={ocppVersions}
          placeholder={translate('ChargingStations.setNetworkProfileModal.selectOcppVersion')}
          required
        />

        <SelectFormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.ocppTransport')}
          name="connectionData.ocppTransport"
          options={ocppTransports}
          placeholder={translate('ChargingStations.setNetworkProfileModal.selectOcppTransport')}
          required
        />

        <FormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.ocppCsmsUrl')}
          name="connectionData.ocppCsmsUrl"
          required
        >
          <Input placeholder="wss://example.com/ocpp" type="url" />
        </FormField>

        <FormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.messageTimeout')}
          name="connectionData.messageTimeout"
        >
          <Input type="number" min="0" />
        </FormField>

        <FormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.securityProfile')}
          name="connectionData.securityProfile"
        >
          <Input type="number" min={0} />
        </FormField>

        <SelectFormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.ocppInterface')}
          name="connectionData.ocppInterface"
          options={ocppInterfaces}
          placeholder={translate('ChargingStations.setNetworkProfileModal.selectOcppInterface')}
          required
        />

        <FormField
          control={form.control}
          label={translate('ChargingStations.setNetworkProfileModal.securityProfile')}
          name="connectionData.securityProfile"
        >
          <Input type="number" min={0} />
        </FormField>
      </div>
      <div className={fieldGrid}>
        {/* APN Section */}
        {/* Checkbox to show/hide APN section */}
        <Field>
          <FieldLabel className={formLabelWrapperStyle}>
            <span className={formLabelStyle}>
              {translate('ChargingStations.setNetworkProfileModal.includeApn')}
            </span>
          </FieldLabel>
          <Checkbox
            className={formCheckboxStyle}
            checked={includeApn}
            onCheckedChange={(checked) => {
              form.setValue('includeApn', checked as boolean);
              if (!checked) {
                form.setValue('connectionData.apn', undefined);
              } else {
                form.setValue('connectionData.apn', {
                  apn: '',
                  apnAuthentication: OCPP2_0_1.APNAuthenticationEnumType.CHAP,
                });
              }
            }}
          />
        </Field>

        {includeApn && (
          <>
            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.apn')}
              name="connectionData.apn.apn"
              required
            >
              <Input
                placeholder={translate('ChargingStations.setNetworkProfileModal.apnPlaceholder')}
              />
            </FormField>

            <SelectFormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.apnAuthentication')}
              name="connectionData.apn.apnAuthentication"
              options={apnAuthenticationTypes}
              placeholder={translate('ChargingStations.setNetworkProfileModal.selectAuthType')}
              required
            />

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.apnUsername')}
              name="connectionData.apn.apnUserName"
            >
              <Input />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.apnPassword')}
              name="connectionData.apn.apnPassword"
            >
              <Input type="password" />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.simPin')}
              name="connectionData.apn.simPin"
            >
              <Input type="number" />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.preferredNetwork')}
              name="connectionData.apn.preferredNetwork"
            >
              <Input />
            </FormField>

            <CheckboxFormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.useOnlyPreferredNetwork')}
              name="connectionData.apn.useOnlyPreferredNetwork"
            />
          </>
        )}
      </div>
      <div className={fieldGrid}>
        {/* VPN Section */}
        {/* Checkbox to show/hide VPN section */}
        <Field>
          <FieldLabel className={formLabelWrapperStyle}>
            <span className={formLabelStyle}>
              {translate('ChargingStations.setNetworkProfileModal.includeVpn')}
            </span>
          </FieldLabel>
          <Checkbox
            className={formCheckboxStyle}
            checked={includeVpn}
            onCheckedChange={(checked) => {
              form.setValue('includeVpn', checked as boolean);
              if (!checked) {
                form.setValue('connectionData.vpn', undefined);
              } else {
                form.setValue('connectionData.vpn', {
                  server: '',
                  user: '',
                  password: '',
                  key: '',
                  type: OCPP2_0_1.VPNEnumType.IKEv2,
                });
              }
            }}
          />
        </Field>

        {includeVpn && (
          <>
            <SelectFormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.vpnType')}
              name="connectionData.vpn.type"
              options={vpnTypes}
              placeholder={translate('ChargingStations.setNetworkProfileModal.selectVpnType')}
              required
            />

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.server')}
              name="connectionData.vpn.server"
              required
            >
              <Input
                placeholder={translate('ChargingStations.setNetworkProfileModal.serverPlaceholder')}
              />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.user')}
              name="connectionData.vpn.user"
              required
            >
              <Input
                placeholder={translate('ChargingStations.setNetworkProfileModal.userPlaceholder')}
              />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.group')}
              name="connectionData.vpn.group"
            >
              <Input />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.password')}
              name="connectionData.vpn.password"
              required
            >
              <Input
                type="password"
                placeholder={translate(
                  'ChargingStations.setNetworkProfileModal.passwordPlaceholder',
                )}
              />
            </FormField>

            <FormField
              control={form.control}
              label={translate('ChargingStations.setNetworkProfileModal.key')}
              name="connectionData.vpn.key"
              required
            >
              <Textarea
                placeholder={translate('ChargingStations.setNetworkProfileModal.keyPlaceholder')}
                rows={3}
              />
            </FormField>
          </>
        )}
      </div>
    </Form>
  );
};
