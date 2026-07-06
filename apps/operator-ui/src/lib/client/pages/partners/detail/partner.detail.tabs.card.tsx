// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Card, CardContent } from '@lib/client/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { PartnerEndpointsTable } from '@lib/client/pages/partners/detail/partner.endpoints.table';
import { PartnerAuthorizations } from '@lib/client/pages/partners/detail/partner.authorizations';
import type { TenantPartnerDto } from '@citrineos/base';
import { cardTabsStyle } from '@lib/client/styles/card';
import { useTranslate } from '@refinedev/core';

export const PartnerDetailTabsCard = ({ tenantPartner }: { tenantPartner: TenantPartnerDto }) => {
  const translate = useTranslate();

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">
              {translate('TenantPartners.tabs.endpoints')}
            </TabsTrigger>
            <TabsTrigger value="authorizations">
              {translate('Authorizations.Authorizations')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className={cardTabsStyle}>
            {typeof tenantPartner?.id === 'number' && tenantPartner?.id > 0 ? (
              <PartnerEndpointsTable
                partnerId={tenantPartner.id}
                endpoints={tenantPartner?.partnerProfileOCPI?.endpoints || []}
                partnerProfileOCPI={tenantPartner?.partnerProfileOCPI}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {translate('TenantPartners.loadingPartnerData')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="authorizations" className={cardTabsStyle}>
            {tenantPartner?.id && <PartnerAuthorizations partnerId={tenantPartner.id} />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
