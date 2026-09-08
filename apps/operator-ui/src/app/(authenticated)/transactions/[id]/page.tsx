// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TransactionDetail } from '@lib/client/pages/transactions/detail/transaction-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShowTransactionPage({ params }: PageProps) {
  const { id } = await params;
  return <TransactionDetail params={{ id }} />;
}
