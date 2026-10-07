// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationSchema, OCPPVersion, TransactionSchema } from '@citrineos/types';
import type { z } from 'zod';
import { VersionedModal, type VersionedRender } from '../versioned-modal';
import { OCPP1_6_RemoteStop } from './1.6';
import { OCPP2_0_1_RemoteStop } from './2.0.1';

const ChargingStationWithTransactionsSchema = ChargingStationSchema.extend({
  transactions: TransactionSchema.array(),
});
export type ChargingStationWithTransactionsDto = z.infer<
  typeof ChargingStationWithTransactionsSchema
>;

export interface RemoteStopTransactionModalProps {
  station: ChargingStationWithTransactionsDto;
  transactionId?: string;
}

export const RemoteStopTransactionModal = ({
  station,
  transactionId,
}: RemoteStopTransactionModalProps) => {
  const render: VersionedRender<ChargingStationWithTransactionsDto> = {
    [OCPPVersion.OCPP1_6]: (s) => <OCPP1_6_RemoteStop station={s} />,
    [OCPPVersion.OCPP2_0_1]: (s) => (
      <OCPP2_0_1_RemoteStop station={s} transactionId={transactionId} />
    ),
    [OCPPVersion.OCPP2_1]: (s) => (
      <OCPP2_0_1_RemoteStop station={s} transactionId={transactionId} />
    ),
  };

  return <VersionedModal station={station} render={render} />;
};
