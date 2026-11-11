// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import type { CheckoutState } from '../api';
import { api, CheckoutStatus } from '../api';
import { Notice, Spinner } from '../components/layout';
import { errorMessage } from '../errors';
import { formatDateTime, formatMajor, formatMinor, formatNumber } from '../format';
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

  const minor = (amount: number) => formatMinor(amount, pricing.currency, locale);
  const unit = (amount: number | null | undefined) =>
    amount == null ? '–' : formatMajor(amount, pricing.currency, locale);
  const lines: [string, string, string, number][] = [
    [t('receipt.sessionFee'), '1', unit(tariff.pricePerSession), pricing.sessionCosts],
    [
      t('receipt.energy'),
      formatNumber(pricing.energyKwh, locale, 3),
      unit(tariff.pricePerKwh),
      pricing.energyCosts,
    ],
    [
      t('receipt.time'),
      formatNumber(pricing.chargingMinutes, locale, 1),
      unit(tariff.pricePerMin),
      pricing.timeCosts,
    ],
  ];
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
      <dl className={ui.details}>
        {evse?.operatorName && (
          <>
            <dt>{t('checkout.operator')}</dt>
            <dd>{evse.operatorName}</dd>
          </>
        )}
        {address && (
          <>
            <dt>{t('checkout.location')}</dt>
            <dd>{address}</dd>
          </>
        )}
        {evse?.evseId && (
          <>
            <dt>{t('receipt.evse')}</dt>
            <dd>{evse.evseId}</dd>
          </>
        )}
        <dt className="self-center">{t('receipt.session')}</dt>
        <dd className={`${ui.mono} self-center`}>{state.publicId}</dd>
        <dt>{t('receipt.start')}</dt>
        <dd>{formatDateTime(transaction.startTime, locale)}</dd>
        {transaction.endTime && (
          <>
            <dt>{t('receipt.end')}</dt>
            <dd>{formatDateTime(transaction.endTime, locale)}</dd>
          </>
        )}
      </dl>

      <table className="my-4 w-full border-collapse text-[0.9rem] [&_td]:border-b [&_td]:border-border [&_td]:px-1 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-border [&_th]:px-1 [&_th]:py-1.5 [&_th]:text-left">
        <thead>
          <tr>
            <th>{t('receipt.item')}</th>
            <th className="text-right! whitespace-nowrap">{t('receipt.quantity')}</th>
            <th className="text-right! whitespace-nowrap">{t('receipt.unitPrice')}</th>
            <th className="text-right! whitespace-nowrap">{t('receipt.net')}</th>
          </tr>
        </thead>
        <tbody>
          {lines
            .filter(([, , , net], index) => net > 0 || index === 1)
            .map(([label, quantity, unitPrice, net]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="text-right! whitespace-nowrap">{quantity}</td>
                <td className="text-right! whitespace-nowrap">{unitPrice}</td>
                <td className="text-right! whitespace-nowrap">{minor(net)}</td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>{t('receipt.totalNet')}</td>
            <td className="text-right! whitespace-nowrap">{minor(pricing.totalCostsNet)}</td>
          </tr>
          <tr>
            <td colSpan={3}>{t('receipt.vat', { rate: formatNumber(pricing.taxRate, locale) })}</td>
            <td className="text-right! whitespace-nowrap">{minor(pricing.taxCosts)}</td>
          </tr>
          <tr className="font-bold">
            <td colSpan={3}>{t('receipt.totalGross')}</td>
            <td className="text-right! whitespace-nowrap">{minor(pricing.totalCostsGross)}</td>
          </tr>
          {state.capturedAmount !== null && (
            <tr className="font-bold">
              <td colSpan={3}>{t('receipt.charged')}</td>
              <td className="text-right! whitespace-nowrap">{minor(state.capturedAmount)}</td>
            </tr>
          )}
        </tfoot>
      </table>
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
