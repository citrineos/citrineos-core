// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CheckoutEvse, Connector } from '../api';
import { formatPower } from '../format';
import { useI18n } from '../i18n';
import { ui } from '../ui';
import { AddressLines, addressLines } from './address';
import { StatusBadge } from './status-badge';

/**
 * The EVSE's printed id, where it stands and who runs it, one row each, as the receipt lists them.
 * With a connector, also what kind it is, how much power it gives and whether it is free.
 */
export function EvseHeader({
  evse,
  connector,
}: {
  evse: CheckoutEvse;
  connector?: Connector | null;
}) {
  const { t, locale } = useI18n();
  const { evseId, location, operatorName } = evse;
  const address = addressLines(location);
  return (
    <section className={ui.card}>
      {evseId && <h1 className="font-mono text-lg font-bold">{evseId}</h1>}
      <dl className={ui.rows}>
        {address.length > 0 && (
          <div className={ui.row}>
            <dt className={ui.rowLabel}>{t('checkout.location')}</dt>
            <dd>
              <AddressLines lines={address} />
            </dd>
          </div>
        )}
        {operatorName && (
          <div className={ui.row}>
            <dt className={ui.rowLabel}>{t('checkout.operator')}</dt>
            <dd>{operatorName}</dd>
          </div>
        )}
        {connector?.type && (
          <div className={ui.row}>
            <dt className={ui.rowLabel}>{t('checkout.connectorType')}</dt>
            <dd>{connector.type}</dd>
          </div>
        )}
        {connector?.maximumPowerWatts ? (
          <div className={ui.row}>
            <dt className={ui.rowLabel}>{t('checkout.power')}</dt>
            <dd>{formatPower(connector.maximumPowerWatts, locale)}</dd>
          </div>
        ) : null}
        {connector?.status && (
          <div className={ui.row}>
            <dt className={ui.rowLabel}>{t('checkout.status')}</dt>
            <dd className="flex items-end self-end">
              <StatusBadge status={connector.status} />
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
