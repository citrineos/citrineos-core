// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import type { TariffDto } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { heading2Style } from '@lib/client/styles/page';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { CanAccess, useTranslate } from '@refinedev/core';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { ChevronLeft, Edit, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@lib/client/components/ui/button';
import { buttonIconSize } from '@lib/client/styles/icon';
import { useDelete } from '@refinedev/core';
import { useRouter } from 'next/navigation';

export interface TariffDetailCardProps {
  tariff: TariffDto;
}

export const TariffDetailCard = ({ tariff }: TariffDetailCardProps) => {
  const { back, push } = useRouter();
  const { mutate: deleteTariff } = useDelete();
  const translate = useTranslate();

  const handleDelete = () => {
    deleteTariff(
      {
        resource: ResourceType.TARIFFS,
        id: tariff.id!,
      },
      {
        onSuccess: () => push(`/${MenuSection.TARIFFS}`),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft
            onClick={() => {
              if (window.history.state?.idx === 0) {
                push(`/${MenuSection.TARIFFS}`);
              } else {
                back();
              }
            }}
            className="cursor-pointer"
          />
          <h2 className={heading2Style}>
            {translate('Tariffs.tariff')} #{tariff.id}
          </h2>
          <CanAccess
            resource={ResourceType.TARIFFS}
            action={ActionType.EDIT}
            params={{ id: tariff.id }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => push(`/${MenuSection.TARIFFS}/${tariff.id}/edit`)}
            >
              <Edit className={buttonIconSize} />
              {translate('buttons.edit')}
            </Button>
          </CanAccess>
          <CanAccess
            resource={ResourceType.TARIFFS}
            action={ActionType.DELETE}
            params={{ id: tariff.id }}
          >
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className={buttonIconSize} />
              {translate('buttons.delete')}
            </Button>
          </CanAccess>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cardGridStyle}>
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.currency')}
            value={tariff.currency}
          />
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.pricePerKwh')}
            value={tariff.pricePerKwh?.toFixed(2) ?? NOT_APPLICABLE}
          />
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.pricePerMin')}
            value={tariff.pricePerMin != null ? tariff.pricePerMin.toFixed(2) : NOT_APPLICABLE}
          />
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.pricePerSession')}
            value={
              tariff.pricePerSession != null ? tariff.pricePerSession.toFixed(2) : NOT_APPLICABLE
            }
          />
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.authorizationAmount')}
            value={
              tariff.authorizationAmount != null
                ? tariff.authorizationAmount.toFixed(2)
                : NOT_APPLICABLE
            }
          />
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.paymentFee')}
            value={tariff.paymentFee != null ? tariff.paymentFee.toFixed(2) : NOT_APPLICABLE}
          />
          <KeyValueDisplay
            keyLabel={translate('Tariffs.detail.taxRate')}
            value={tariff.taxRate != null ? tariff.taxRate.toFixed(4) : NOT_APPLICABLE}
          />
        </div>
      </CardContent>
    </Card>
  );
};
