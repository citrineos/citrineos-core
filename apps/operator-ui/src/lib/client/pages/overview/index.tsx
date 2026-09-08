// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { ActiveTransactionsCard } from '@lib/client/pages/overview/active-transactions/active-transactions-card';
import { ChargerActivityCard } from '@lib/client/pages/overview/charger-activity/charger-activity-card';
import { LocationsCard } from '@lib/client/pages/overview/locations/locations-card';
import { OnlineStatusCard } from '@lib/client/pages/overview/online-status/online-status-card';
import { PluginSuccessRateCard } from '@lib/client/pages/overview/plugin-success-rate/plugin-success-rate-card';

export const Overview = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OnlineStatusCard />
        <ChargerActivityCard />
        <PluginSuccessRateCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-9 gap-4">
        <div className="lg:col-span-5 w-full h-150">
          <LocationsCard />
        </div>
        <div className="lg:col-span-4 w-full h-150">
          <ActiveTransactionsCard />
        </div>
      </div>
    </div>
  );
};
