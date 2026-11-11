// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from 'react';
import type { CheckoutState, CheckoutStatus } from '../api';
import { api } from '../api';
import { BoltIcon, Notice, Spinner } from '../components/layout';
import { EvseHeader } from '../components/evse-header';
import { errorMessage } from '../errors';
import { formatDuration, formatMinor, formatNumber, secondsBetween } from '../format';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n';
import { followLink } from '../router';
import { ui } from '../ui';

/** Statuses that will still change on their own; the page keeps asking while in one. */
const ONGOING: CheckoutStatus[] = [
  'Created',
  'Authorized',
  'StartRequested',
  'Charging',
  'Capturing',
];

export const POLL_INTERVAL_MS = 5_000;

export function Charging({ publicId }: { publicId: string }) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<CheckoutState | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setState(await api.checkout(publicId));
      setUpdatedAt(new Date());
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught, { 404: 'charging.notFound', 400: 'charging.notFound' }));
    }
  }, [publicId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ongoing = state === null || ONGOING.includes(state.status);
  useEffect(() => {
    if (!ongoing) {
      return;
    }
    const poll = setInterval(() => void load(), POLL_INTERVAL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [ongoing, load]);

  if (!state) {
    return error ? <Notice tone="error">{t(error)}</Notice> : <Spinner />;
  }

  const money = (amount: number) => formatMinor(amount, state.currency, locale);
  const { transaction, pricing } = state;
  const rejected = state.status === 'Cancelled' && state.remoteStartStatus === 'Rejected';
  const finished = state.status === 'Capturing' || state.status === 'Captured';
  const headline: MessageKey =
    state.status === 'Created'
      ? state.flow === 'ScanAndCharge'
        ? 'status.Created.ScanAndCharge'
        : 'status.Created.WebPortal'
      : rejected
        ? 'status.Rejected'
        : `status.${state.status}`;

  return (
    <>
      {state.evse && <EvseHeader evse={state.evse} />}
      <section className={`${ui.card} text-center`} aria-live="polite">
        <div className="flex min-h-8 justify-center text-primary">
          {state.status === 'Charging' ? (
            <BoltIcon className="size-8" />
          ) : ongoing ? (
            <Spinner />
          ) : null}
        </div>
        <h1 className={ui.title}>{t(headline)}</h1>

        {state.status === 'Created' && state.flow === 'ScanAndCharge' && (
          <a className={ui.primaryButton} href={api.payUrl(publicId)}>
            {t('charging.payNow')}
          </a>
        )}
        {state.status === 'Created' && state.flow === 'WebPortal' && state.evse && (
          <a className={ui.primaryButton} href={`/checkout/${state.evse.id}`} onClick={followLink}>
            {t('action.retry')}
          </a>
        )}
        {state.status === 'Cancelled' && <p>{t('charging.noCharge')}</p>}
        {rejected && state.evse && (
          <a className={ui.primaryButton} href={`/checkout/${state.evse.id}`} onClick={followLink}>
            {t('action.retry')}
          </a>
        )}
        {state.status === 'Failed' && <p>{t('charging.failedHelp')}</p>}

        {transaction?.startTime && (state.status === 'Charging' || finished) && (
          <dl className="my-4 grid gap-3 [&_dd]:text-lg [&_dd]:font-semibold [&_dt]:text-muted-foreground">
            <div>
              <dt>{finished ? t('charging.finalCost') : t('charging.cost')}</dt>
              <dd className="text-[2rem]!">
                {finished && state.capturedAmount !== null
                  ? money(state.capturedAmount)
                  : money(pricing?.totalCostsGross ?? 0)}
              </dd>
            </div>
            <div>
              <dt>{t('charging.time')}</dt>
              <dd>
                {formatDuration(
                  secondsBetween(transaction.startTime, transaction.endTime ?? null, now),
                )}
              </dd>
            </div>
            <div>
              <dt>{t('charging.energy')}</dt>
              <dd>{formatNumber(pricing?.energyKwh ?? 0, locale, 3)} kWh</dd>
            </div>
          </dl>
        )}

        {state.status === 'Captured' && (
          <a className={ui.button} href={`/receipt/${publicId}`} onClick={followLink}>
            {t('charging.receipt')}
          </a>
        )}
        {ongoing && (
          <button type="button" className={ui.button} onClick={() => void load()}>
            {t('action.refresh')}
          </button>
        )}
        {updatedAt && ongoing && (
          <p className={`${ui.muted} ${ui.small}`}>
            {t('charging.lastUpdate', {
              time: updatedAt.toLocaleTimeString(locale, { timeStyle: 'medium' }),
            })}
          </p>
        )}
        {error && <Notice tone="error">{t(error)}</Notice>}
      </section>
    </>
  );
}
