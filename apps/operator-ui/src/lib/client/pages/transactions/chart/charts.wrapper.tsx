// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { type MeterValueDto, OCPP2_0_1 } from '@citrineos/types';
import { PowerOverTime } from '@lib/client/pages/transactions/chart/power.over.time';
import { EnergyOverTime } from '@lib/client/pages/transactions/chart/energy.over.time';
import { StateOfCharge } from '@lib/client/pages/transactions/chart/state.of.charge';
import { VoltageOverTime } from '@lib/client/pages/transactions/chart/voltage.over.time';
import { CurrentOverTime } from '@lib/client/pages/transactions/chart/current.over.time';

export const ChartsWrapper = ({
  meterValues,
  validContexts,
}: {
  meterValues: MeterValueDto[];
  validContexts: OCPP2_0_1.ReadingContextEnumType[];
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <PowerOverTime meterValues={meterValues} validContexts={validContexts} />
      <EnergyOverTime meterValues={meterValues} validContexts={validContexts} />
      <StateOfCharge meterValues={meterValues} validContexts={validContexts} />
      <VoltageOverTime meterValues={meterValues} validContexts={validContexts} />
      <CurrentOverTime meterValues={meterValues} validContexts={validContexts} />
    </div>
  );
};
