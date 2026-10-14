// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { NetworkAlertOccurrencesList } from '@lib/client/pages/network-alerts/detail/network-alert-occurrences/network-alert-occurrences-list';
import type { NetworkAlertWithRelationsDto } from '@lib/cls/network-alert-dto';
import { cardTabsStyle } from '@lib/client/styles/card';
import { useTranslate } from '@refinedev/core';

export const NetworkAlertDetailTabsCard = ({ alert }: { alert: NetworkAlertWithRelationsDto }) => {
  const translate = useTranslate();

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="occurrences">
          <TabsList>
            <TabsTrigger value="occurrences">
              {translate('NetworkAlerts.tabs.occurrences')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="occurrences" className={cardTabsStyle}>
            {alert.id != null && <NetworkAlertOccurrencesList alertId={alert.id} />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
