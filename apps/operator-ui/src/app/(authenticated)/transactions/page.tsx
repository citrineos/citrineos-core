// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TransactionsList } from '@lib/client/pages/transactions/list/transactions-list';
import { StationPreviewLayout } from '@lib/client/pages/charging-stations/station-preview-layout';

export default function ListTransactionPage() {
  return (
    <StationPreviewLayout>
      <TransactionsList />
    </StationPreviewLayout>
  );
}
