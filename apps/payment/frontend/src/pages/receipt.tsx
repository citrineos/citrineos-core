// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import type { CheckoutState } from '../api';
import { api, CheckoutStatus } from '../api';
import { Notice, Spinner } from '../components/layout';
import { errorMessage } from '../errors';
import { formatDateTime, formatElapsed, formatMajor, formatMinor, formatNumber } from '../format';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n';
import { ui } from '../ui';

export function Receipt({ publicId }: { publicId: string }) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    let current = true;
    api.checkout(publicId).then(
      (loaded) => current && setState(loaded),
      (caught: unknown) =>
        current &&
        setError(errorMessage(caught, { 404: 'charging.notFound', 400: 'charging.notFound' })),
    );
    return () => {
      current = false;
    };
  }, [publicId]);

  if (error) {
    return <Notice tone="error">{t(error)}</Notice>;
  }
  if (!state) {
    return <Spinner />;
  }
  const { pricing, transaction, tariff, evse } = state;
  if (state.status !== CheckoutStatus.Captured || !pricing || !transaction?.startTime) {
    return <Notice tone="info">{t('receipt.notReady')}</Notice>;
  }

  // One line of the receipt: the label, and its value on the right.
  const row = 'flex items-center justify-between gap-3 py-1.5 [&>dt]:shrink-0';
  const minor = (amount: number) => formatMinor(amount, pricing.currency, locale);
  const unit = (amount: number | null | undefined) =>
    amount == null ? '–' : formatMajor(amount, pricing.currency, locale);

  const location = evse?.location;
  const address = location
    ? [
        location.address,
        [location.postalCode, location.city].filter(Boolean).join(' '),
        location.country,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <article className={`${ui.card} print:border-0`}>
      <h1 className={ui.title}>{t('receipt.title')}</h1>
      <dl className="divide-y divide-border text-sm">
        {evse?.operatorName && (
          <div className={row}>
            <dt>{t('checkout.operator')}</dt>
            <dd className="text-right">{evse.operatorName}</dd>
          </div>
        )}
        {address && (
          <div className={row}>
            <dt>{t('checkout.location')}</dt>
            <dd className="text-right">{address}</dd>
          </div>
        )}
        {evse?.evseId && (
          <div className={row}>
            <dt>{t('receipt.evse')}</dt>
            <dd className="text-right">{evse.evseId}</dd>
          </div>
        )}
        <div className={row}>
          <dt>{t('receipt.id')}</dt>
          <dd className={`${ui.mono} min-w-0 text-right`}>{transaction.transactionId}</dd>
        </div>
        <div className={row}>
          <dt>{t('receipt.start')}</dt>
          <dd className="text-right">{formatDateTime(transaction.startTime, locale)}</dd>
        </div>
        {transaction.endTime && (
          <div className={row}>
            <dt>{t('receipt.end')}</dt>
            <dd className="text-right">{formatDateTime(transaction.endTime, locale)}</dd>
          </div>
        )}
      </dl>

      <hr className="border-t-2 border-border" />

      <dl className="divide-y divide-border text-sm">
        <div className={row}>
          <dt className="font-bold">{t('receipt.totalGross')}</dt>
          <dd className="text-right font-bold">{minor(pricing.totalCostsGross)}</dd>
        </div>
        {state.capturedAmount !== null && (
          <div className={row}>
            <dt className="font-bold">{t('receipt.charged')}</dt>
            <dd className="font-bold text-right">{minor(state.capturedAmount)}</dd>
          </div>
        )}
      </dl>

      <hr className="border-t-2 border-border" />

      <section className="space-y-1">
        <h2 className={ui.heading}>{t('receipt.overview')}</h2>
        <dl className="divide-y divide-border text-sm">
          <div className={row}>
            <dt>{t('receipt.energy')}</dt>
            <dd className="text-right">
              {formatNumber(pricing.energyKwh, locale, 3)} {t('receipt.energyUnit')}
            </dd>
          </div>
          <div className={row}>
            <dt>{t('receipt.time')}</dt>
            <dd className="text-right">{formatElapsed(pricing.chargingMinutes * 60, t)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-1">
        <h2 className={ui.heading}>{t('receipt.costBreakdown')}</h2>
        <dl className="divide-y divide-border text-sm">
          <div className={row}>
            <dt>{t('receipt.energyCost', { unitPrice: unit(tariff.pricePerKwh) })}</dt>
            <dd className="text-right">{minor(pricing.energyCosts)}</dd>
          </div>
          <div className={row}>
            <dt>{t('receipt.timeCost', { unitPrice: unit(tariff.pricePerMin) })}</dt>
            <dd className="text-right">{minor(pricing.timeCosts)}</dd>
          </div>
          <div className={row}>
            <dt>{t('receipt.sessionFee')}</dt>
            <dd className="text-right">{minor(pricing.sessionCosts)}</dd>
          </div>
          <div className={row}>
            <dt>{t('receipt.totalNet')}</dt>
            <dd className="text-right">{minor(pricing.totalCostsNet)}</dd>
          </div>
          <div className={row}>
            <dt>{t('receipt.vat', { rate: formatNumber(pricing.taxRate, locale) })}</dt>
            <dd className="text-right">{minor(pricing.taxCosts)}</dd>
          </div>
        </dl>
      </section>

      {state.capturedAmount !== null && state.capturedAmount < pricing.totalCostsGross && (
        <p className={`${ui.muted} ${ui.small}`}>{t('receipt.capped')}</p>
      )}
      {evse?.operatorName && (
        <p className={`${ui.muted} ${ui.small}`}>
          {t('receipt.contact', { operator: evse.operatorName })}
        </p>
      )}
      <button type="button" className={`${ui.button} print:hidden`} onClick={() => window.print()}>
        {t('action.print')}
      </button>
    </article>
  );
}
