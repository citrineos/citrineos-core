// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { LocationsMap } from '@lib/client/pages/locations/map/locations.map';
import { ChevronRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@lib/client/components/ui/card';
import { CardContent } from '@ferdiunal/refine-shadcn/ui';
import { heading2Style } from '@lib/client/styles/page';
import { overviewClickableStyle } from '@lib/client/styles/card';
import { useTranslate } from '@refinedev/core';

export const LocationsCard = () => {
  const { push } = useRouter();
  const translate = useTranslate();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className={heading2Style}>{translate('Locations.Locations')}</h2>
          <div className={overviewClickableStyle} onClick={() => push(`/${MenuSection.LOCATIONS}`)}>
            {translate('Overview.viewAllLocations')} <ChevronRightIcon />
          </div>
        </div>
      </CardHeader>
      <CardContent className="size-full">
        <LocationsMap />
      </CardContent>
    </Card>
  );
};
