// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CheckoutEvse } from '../api';
import { useI18n } from '../i18n';
import { ui } from '../ui';

/** The EVSE's printed id, where it stands and who runs it. */
export function EvseHeader({ evse }: { evse: CheckoutEvse }) {
  const { t } = useI18n();
  const { evseId, location, operatorName } = evse;
  const address = location
    ? [
        location.address,
        [location.postalCode, location.city].filter(Boolean).join(' '),
        location.country,
      ]
        .filter(Boolean)
        .join(', ')
    : '';
  return (
    <section className={ui.card}>
      {evseId && <h1 className="font-mono text-lg font-bold">{evseId}</h1>}
      <dl className={ui.details}>
        {location && (location.name || address) && (
          <>
            <dt>{t('checkout.location')}</dt>
            <dd>
              {location.name && <div>{location.name}</div>}
              {address && <div className={ui.muted}>{address}</div>}
            </dd>
          </>
        )}
        {operatorName && (
          <>
            <dt>{t('checkout.operator')}</dt>
            <dd>{operatorName}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
