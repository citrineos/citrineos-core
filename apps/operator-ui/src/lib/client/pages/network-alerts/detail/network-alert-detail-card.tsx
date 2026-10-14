// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { MenuSection } from '@lib/client/components/main-menu/main-menu';
import { chargingStationPath } from '@lib/utils/resource-paths';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { clickableLinkStyle, heading2Style } from '@lib/client/styles/page';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { Link, useTranslate } from '@refinedev/core';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import type { NetworkAlertWithRelationsDto } from '@lib/cls/network-alert-dto';
import {
  NetworkAlertSeverityTag,
  NetworkAlertStatusTag,
} from '@lib/client/pages/network-alerts/network-alert-tags';

const NetworkAlertTypeDetails = ({ alert }: { alert: NetworkAlertWithRelationsDto }) => {
  const translate = useTranslate();

  switch (alert.type) {
    case 'StationConnectivity':
      return (
        <KeyValueDisplay
          keyLabel={translate('NetworkAlerts.detail.offlineSince')}
          value={alert.details.offlineSince}
          valueRender={(offlineSince) =>
            offlineSince ? (
              <TimestampDisplay isoTimestamp={offlineSince} />
            ) : (
              <span>{NOT_APPLICABLE}</span>
            )
          }
        />
      );
    case 'ConnectorStatus':
      return (
        <>
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.connectorStatus')}
            value={alert.details.status}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.errorCode')}
            value={alert.details.errorCode}
          />
        </>
      );
    case 'OcppCallFailures':
      return (
        <>
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.reasons')}
            value={alert.details.reasons.join(', ') || NOT_APPLICABLE}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.actions')}
            value={alert.details.actions.join(', ') || NOT_APPLICABLE}
          />
        </>
      );
  }
};

export const NetworkAlertDetailCard = ({ alert }: { alert: NetworkAlertWithRelationsDto }) => {
  const { back, push } = useRouter();
  const translate = useTranslate();

  return (
    <Card>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft
            onClick={() => {
              if (window.history.state?.idx === 0) {
                push(`/${MenuSection.NETWORK_ALERTS}`);
              } else {
                back();
              }
            }}
            className="cursor-pointer"
          />
          <h2 className={heading2Style}>
            {translate('NetworkAlerts.networkAlert')} {alert.id}
          </h2>
          <NetworkAlertSeverityTag severity={alert.severity} />
          <NetworkAlertStatusTag status={alert.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cardGridStyle}>
          <KeyValueDisplay keyLabel={translate('NetworkAlerts.detail.type')} value={alert.type} />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.stationId')}
            value={''}
            valueRender={() =>
              alert.station?.ocppConnectionName ? (
                <Link
                  to={chargingStationPath(alert.station.ocppConnectionName)}
                  className={clickableLinkStyle}
                  title={alert.station.ocppConnectionName}
                >
                  {alert.station.ocppConnectionName}
                </Link>
              ) : (
                <span>{NOT_APPLICABLE}</span>
              )
            }
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.evse')}
            value={alert.evse?.evseTypeId}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.connector')}
            value={alert.connector?.connectorId}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.firstSeenAt')}
            value={alert.firstSeenAt}
            valueRender={(firstSeenAt) => <TimestampDisplay isoTimestamp={firstSeenAt} />}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.lastSeenAt')}
            value={alert.lastSeenAt}
            valueRender={(lastSeenAt) => <TimestampDisplay isoTimestamp={lastSeenAt} />}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.occurrenceCount')}
            value={alert.occurrenceCount}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.resolvedAt')}
            value={alert.resolvedAt}
            valueRender={(resolvedAt) =>
              resolvedAt ? (
                <TimestampDisplay isoTimestamp={resolvedAt} />
              ) : (
                <span>{NOT_APPLICABLE}</span>
              )
            }
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.resolvedBy')}
            value={alert.resolvedBy}
          />
          <KeyValueDisplay
            keyLabel={translate('NetworkAlerts.detail.statusNote')}
            value={alert.statusNote}
          />
          <NetworkAlertTypeDetails alert={alert} />
        </div>
      </CardContent>
    </Card>
  );
};
