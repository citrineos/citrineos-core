// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { TransactionDto } from '@citrineos/types';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslate } from '@refinedev/core';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { clickableLinkStyle } from '@lib/client/styles/page';
import { getPaymentCheckoutAction } from '@lib/server/actions/payment/get-payment-checkout-action';
import config from '@lib/utils/config';
import { mayHavePaymentCheckout, PaymentPage } from '@lib/utils/payment-checkout';

/**
 * When a driver paid for the transaction through the payment app, links to what the driver saw:
 * the receipt once the payment was captured, else the page that follows the session. Shows
 * nothing otherwise, or when no payment app is configured. Does not ask the payment app about a
 * transaction another token authorized.
 */
export const PaymentCheckoutLink = ({ transaction }: { transaction: TransactionDto }) => {
  const translate = useTranslate();
  const transactionId = transaction.id;
  const { data: link } = useQuery({
    queryKey: ['payment-checkout', transactionId],
    queryFn: async () => {
      const result = await getPaymentCheckoutAction(transactionId!);
      return result.success ? result.data : null;
    },
    enabled:
      transactionId !== undefined &&
      mayHavePaymentCheckout(transaction, config.paymentIdTokenPrefix),
    retry: false,
    staleTime: 30_000,
  });

  if (!link) {
    return null;
  }
  return (
    <KeyValueDisplay
      keyLabel={translate('Transactions.detail.payment')}
      value={''}
      valueRender={() => (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className={clickableLinkStyle}>
          {link.page === PaymentPage.Receipt
            ? translate('Transactions.detail.viewReceipt')
            : translate('Transactions.detail.viewDriverPage')}
        </a>
      )}
    />
  );
};
