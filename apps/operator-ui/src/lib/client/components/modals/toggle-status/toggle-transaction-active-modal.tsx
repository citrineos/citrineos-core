// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import { TRANSACTION_EDIT_MUTATION } from '@lib/queries/transactions';
import { closeModal } from '@lib/utils/store/modal-slice';
import { ResourceType } from '@lib/utils/access-types';
import { useTranslate, useUpdate } from '@refinedev/core';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

export interface ToggleTransactionActiveModalProps {
  transactionId: number;
  currentStatus: boolean;
  onSuccess?: () => void;
}

export const ToggleTransactionActiveModal = ({
  transactionId,
  currentStatus,
  onSuccess,
}: ToggleTransactionActiveModalProps) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [loading, setLoading] = useState(false);
  const { mutate } = useUpdate();

  const newStatus = !currentStatus;
  const newStatusText = newStatus ? 'Active' : 'Inactive';

  const handleSubmit = async () => {
    setLoading(true);

    mutate(
      {
        id: transactionId,
        resource: ResourceType.TRANSACTIONS,
        values: { isActive: newStatus },
        meta: {
          gqlMutation: TRANSACTION_EDIT_MUTATION,
        },
      },
      {
        onSuccess: () => {
          setLoading(false);
          dispatch(closeModal());
          onSuccess?.();
        },
        onError: () => {
          setLoading(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>
          {translate('Transactions.toggleActiveWarning')} <strong>{newStatusText}</strong>.
        </p>
        <p className="mt-2 font-semibold text-destructive">
          {translate('Transactions.toggleActiveCaution')}
        </p>
        <p className="mt-2">{translate('buttons.confirm')}</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => dispatch(closeModal())}>
          {translate('buttons.cancel')}
        </Button>
        <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
          {loading ? translate('buttons.saving') : translate('buttons.confirmText')}
        </Button>
      </div>
    </div>
  );
};
