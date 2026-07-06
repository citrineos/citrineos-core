// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, OCPP2_0_1 } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, SelectFormField } from '@lib/client/components/form/field';
import { Input } from '@lib/client/components/ui/input';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { CHARGING_STATION_SEQUENCES_GET_QUERY } from '@lib/queries/charging.station.sequences';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useApiUrl, useCustom, useGetIdentity, useTranslate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { plainToInstance } from 'class-transformer';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import z from 'zod';
import { Form } from '@lib/client/components/form';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface GetBaseReportModalProps {
  station: any;
}

type GetBaseReportFormData = {
  requestId: number;
  reportBase: OCPP2_0_1.ReportBaseEnumType;
};

const reportBaseTypes = Object.keys(OCPP2_0_1.ReportBaseEnumType);

export const GetBaseReportModal = ({ station }: GetBaseReportModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);

  const GetBaseReportSchema = useMemo(
    () =>
      z.object({
        requestId: z.coerce
          .number<number>()
          .int()
          .positive(translate('ChargingStations.requestId.positiveError')),
        reportBase: z.enum(OCPP2_0_1.ReportBaseEnumType, {
          message: translate('ChargingStations.getBaseReportModal.reportBaseRequired'),
        }),
      }),
    [translate],
  );

  const tenantId = useTenantId();

  const parsedStation: ChargingStationDto = useMemo(
    () => plainToInstance(ChargingStationClass, station),
    [station],
  ) as ChargingStationDto;

  const apiUrl = useApiUrl();
  const {
    query: { data: requestIdResponse, isLoading: isLoadingRequestId },
  } = useCustom<any>({
    url: `${apiUrl}`,
    method: 'post',
    config: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    meta: {
      operation: 'ChargingStationSequencesGet',
      gqlQuery: CHARGING_STATION_SEQUENCES_GET_QUERY,
      gqlVariables: {
        stationId: parsedStation.id,
        type: 'getBaseReport',
      },
    },
  });

  const form = useForm({
    resolver: zodResolver(GetBaseReportSchema),
    defaultValues: {
      requestId: 1,
      reportBase: OCPP2_0_1.ReportBaseEnumType.FullInventory,
    },
  });

  useEffect(() => {
    if (requestIdResponse?.data?.ChargingStationSequences?.[0]?.value) {
      form.setValue('requestId', requestIdResponse.data.ChargingStationSequences[0].value);
    }
  }, [requestIdResponse, form]);

  const onFinish = (values: GetBaseReportFormData) => {
    if (!parsedStation?.ocppConnectionName) {
      console.error('Error: Cannot submit Get Base Report request because station ID is missing.');
      return;
    }

    const data = {
      requestId: values.requestId,
      reportBase: values.reportBase,
    };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/reporting/getBaseReport?identifier=${parsedStation.ocppConnectionName}&tenantId=${tenantId}`,
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
      submitHandler={onFinish}
      loading={loading}
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

      <SelectFormField
        control={form.control}
        label={translate('ChargingStations.getBaseReportModal.reportBase')}
        name="reportBase"
        options={reportBaseTypes}
        placeholder={translate('ChargingStations.getBaseReportModal.selectReportBase')}
        required
      />
    </Form>
  );
};
