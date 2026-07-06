// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Button } from '@lib/client/components/ui/button';
import { ChevronLeft, Edit } from 'lucide-react';
import type { TenantPartnerDto } from '@citrineos/base';
import { useRouter } from 'next/navigation';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { buttonIconSize } from '@lib/client/styles/icon';
import { heading2Style } from '@lib/client/styles/page';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { Badge } from '@lib/client/components/ui/badge';
import Image from 'next/image';
import { useTranslate } from '@refinedev/core';

export const PartnerDetailCard = ({ tenantPartner }: { tenantPartner: TenantPartnerDto }) => {
  const { back, push } = useRouter();
  const translate = useTranslate();

  const businessDetails = tenantPartner?.partnerProfileOCPI?.roles?.[0]?.businessDetails;

  return (
    <Card>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft
            onClick={() => {
              if (window.history.state?.idx === 0) {
                push(`/${MenuSection.PARTNERS}`);
              } else {
                back();
              }
            }}
            className="cursor-pointer"
          />
          <h2 className={heading2Style}>
            {translate('TenantPartners.tenantPartner')} {businessDetails?.name}
          </h2>
          {businessDetails?.logo?.url && (
            <Image
              width={40}
              src={businessDetails.logo.url}
              alt={translate('TenantPartners.detail.logoAlt', { name: businessDetails.name })}
              className="rounded"
            />
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => push(`/${MenuSection.PARTNERS}/${tenantPartner.id}/edit`)}
          >
            <Edit className={buttonIconSize} />
            {translate('buttons.edit')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cardGridStyle}>
          <KeyValueDisplay
            keyLabel={translate('TenantPartners.detail.countryCode')}
            value={tenantPartner?.countryCode}
          />
          <KeyValueDisplay
            keyLabel={translate('TenantPartners.detail.partyId')}
            value={tenantPartner?.partyId}
          />
          <KeyValueDisplay
            keyLabel={translate('TenantPartners.detail.website')}
            value={''}
            valueRender={() =>
              businessDetails?.website ? (
                <a
                  href={businessDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {businessDetails.website}
                </a>
              ) : (
                <span>{NOT_APPLICABLE}</span>
              )
            }
          />
          <KeyValueDisplay
            keyLabel={translate('TenantPartners.detail.roles')}
            value={''}
            valueRender={() =>
              tenantPartner?.partnerProfileOCPI?.roles?.map((role: any) => (
                <Badge key={role.role}>{role.role}</Badge>
              ))
            }
          />
          <KeyValueDisplay
            keyLabel={translate('TenantPartners.detail.ocpiVersion')}
            value={tenantPartner?.partnerProfileOCPI?.version?.version}
          />
          <KeyValueDisplay
            keyLabel={translate('TenantPartners.detail.versionsUrl')}
            value={''}
            valueRender={() =>
              tenantPartner?.partnerProfileOCPI?.version?.versionDetailsUrl ? (
                <a
                  href={tenantPartner.partnerProfileOCPI.version.versionDetailsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {tenantPartner.partnerProfileOCPI.version.versionDetailsUrl}
                </a>
              ) : (
                <span>{NOT_APPLICABLE}</span>
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
