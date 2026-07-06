// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { TransactionDto } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/base';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@lib/client/components/form';
import { ComboboxFormField } from '@lib/client/components/form/field';
import type { ChargingStationWithTransactionsDto } from '@lib/client/components/modals/remote-stop/remote.stop.modal';
import type { MessageConfirmation } from '@lib/utils/MessageConfirmation';
import { triggerMessageAndHandleResponse } from '@lib/utils/messages.utils';
import { closeModal } from '@lib/utils/store/modal.slice';
import { useForm } from '@refinedev/react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslate } from '@refinedev/core';
import z from 'zod';
import { FormButtonVariants } from '@lib/client/components/buttons/form.button';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface OCPP1_6_RemoteStopProps {
  station: ChargingStationWithTransactionsDto;
}

type RemoteStopFormData = {
  transactionId: string;
};

export const OCPP1_6_RemoteStop = ({ station }: OCPP1_6_RemoteStopProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState<boolean>(false);

  const tenantId = useTenantId();

  const RemoteStopSchema = useMemo(
    () =>
      z.object({
        transactionId: z
          .string()
          .min(1, translate('ChargingStations.remoteStopModal.transactionRequired')),
      }),
    [translate],
  );

  const form = useForm({
    resolver: zodResolver(RemoteStopSchema),
    defaultValues: {
      transactionId: '',
    },
  });

  const onFinish = (values: RemoteStopFormData) => {
    const data = { transactionId: values.transactionId };

    triggerMessageAndHandleResponse<MessageConfirmation[]>({
      translate,
      url: `/evdriver/remoteStopTransaction?identifier=${station.ocppConnectionName}&tenantId=${tenantId}`,
      data,
      ocppVersion: OCPPVersion.OCPP1_6,
      setLoading,
    }).then(() => {
      form.reset();
      dispatch(closeModal());
    });
  };

  // Set initial value when transactions are loaded
  useEffect(() => {
    if (station.transactions && station.transactions.length > 0) {
      form.setValue('transactionId', station.transactions[0].transactionId);
    }
  }, [station, form]);

  // Handle the case when there are no active transactions
  const hasNoActiveTransactions = station.transactions && station.transactions.length === 0;

  return hasNoActiveTransactions ? (
    <div>{translate('ChargingStations.remoteStopModal.noActiveTransactions')}</div>
  ) : (
    <Form
      {...form}
      loading={loading}
      submitHandler={onFinish}
      hideCancel
      submitButtonVariant={FormButtonVariants.delete}
      submitButtonLabel={translate('ChargingStations.remoteStopModal.stop')}
    >
      <ComboboxFormField
        control={form.control}
        label={translate('ChargingStations.remoteStopModal.activeTransactions')}
        name="transactionId"
        options={station.transactions.map((transaction: TransactionDto) => ({
          label: transaction.transactionId,
          value: transaction.transactionId,
        }))}
        placeholder={translate('ChargingStations.remoteStopModal.selectTransaction')}
        searchPlaceholder={translate('ChargingStations.remoteStopModal.searchTransactions')}
        required
      />
    </Form>
  );
};
