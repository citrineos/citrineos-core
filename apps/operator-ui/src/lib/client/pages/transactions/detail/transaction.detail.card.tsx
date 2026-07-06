// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useCallback } from 'react';
import type { TransactionDto } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { ModalComponentType } from '@lib/client/components/modals/modal.types';
import { Badge } from '@lib/client/components/ui/badge';
import { Button } from '@lib/client/components/ui/button';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { buttonIconSize } from '@lib/client/styles/icon';
import { clickableLinkStyle, heading2Style } from '@lib/client/styles/page';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { CanAccess, Link, useTranslate } from '@refinedev/core';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { openModal } from '@lib/utils/store/modal.slice';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';

export interface TransactionDetailCardProps {
  transaction: TransactionDto;
}

export const TransactionDetailCard = ({ transaction }: TransactionDetailCardProps) => {
  const { back, push } = useRouter();
  const dispatch = useDispatch();
  const translate = useTranslate();

  const showToggleActiveModal = useCallback(() => {
    dispatch(
      openModal({
        title: translate('Transactions.toggleActiveStatus'),
        modalComponentType: ModalComponentType.toggleTransactionActiveStatus,
        modalComponentProps: {
          transactionId: transaction.id,
          currentStatus: transaction.isActive,
        },
      }),
    );
  }, [dispatch, transaction, translate]);

  console.log(transaction);

  return (
    <Card>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft
            onClick={() => {
              if (window.history.state?.idx === 0) {
                push(`/${MenuSection.TRANSACTIONS}`);
              } else {
                back();
              }
            }}
            className="cursor-pointer"
          />
          <h2 className={heading2Style}>
            {translate('Transactions.transaction')} {transaction.transactionId}
          </h2>
          <Badge variant={transaction.isActive ? 'success' : 'destructive'}>
            {transaction.isActive ? translate('Common.active') : translate('Common.inactive')}
          </Badge>
          <CanAccess
            resource={ResourceType.TRANSACTIONS}
            action={ActionType.EDIT}
            params={{ id: transaction.id }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={showToggleActiveModal}
              title={translate('Transactions.toggleActiveStatus', 'Toggle Active Status')}
            >
              <RefreshCw className={buttonIconSize} />
            </Button>
          </CanAccess>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cardGridStyle}>
          <KeyValueDisplay
            keyLabel={translate('Authorizations.authorization')}
            value={''}
            valueRender={() =>
              transaction.authorization?.idToken ? (
                <Link
                  to={`/${MenuSection.AUTHORIZATIONS}/${transaction.authorizationId}`}
                  className={clickableLinkStyle}
                  title={transaction.authorization.idToken}
                >
                  {transaction.authorization.idToken}
                </Link>
              ) : (
                <span>{NOT_APPLICABLE}</span>
              )
            }
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.stationId')}
            value={''}
            valueRender={() => (
              <Link
                to={`/${MenuSection.CHARGING_STATIONS}/${transaction.stationId}`}
                className={clickableLinkStyle}
                title={transaction.ocppConnectionName}
              >
                {transaction.ocppConnectionName}
              </Link>
            )}
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.location')}
            value={''}
            valueRender={() => (
              <Link
                to={`/${MenuSection.LOCATIONS}/${transaction.locationId}`}
                className={clickableLinkStyle}
                title={transaction.locationId}
              >
                {transaction.location?.name ?? NOT_APPLICABLE}
              </Link>
            )}
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.totalKwh')}
            value={`${transaction.totalKwh ? transaction.totalKwh.toFixed(2) : 0} kWh`}
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.chargingState')}
            value={transaction.chargingState}
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.startTime')}
            value={transaction.startTime}
            valueRender={(startTime) => <TimestampDisplay isoTimestamp={startTime ?? ''} />}
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.endTime')}
            value={transaction.endTime}
            valueRender={(endTime) => <TimestampDisplay isoTimestamp={endTime ?? ''} />}
          />
          <KeyValueDisplay
            keyLabel={translate('Transactions.detail.tariff')}
            value={''}
            valueRender={() =>
              transaction.connector?.tariff ? (
                <Link
                  to={`/${MenuSection.TARIFFS}/${transaction.connector!.tariff!.id}`}
                  className={clickableLinkStyle}
                  title={`#${transaction.connector.tariff.id} - ${transaction.connector.tariff.currency} ${transaction.connector.tariff.pricePerKwh}/kWh`}
                >
                  {`#${transaction.connector.tariff.id} - ${transaction.connector.tariff.currency} ${transaction.connector.tariff.pricePerKwh}/kWh`}
                </Link>
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
