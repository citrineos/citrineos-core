// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import type { Connector, EvseOffer, TariffSummary } from '../api';
import { api } from '../api';
import { BoltIcon, Notice, Spinner } from '../components/layout';
import { EvseHeader } from '../components/evse-header';
import { StatusBadge } from '../components/status-badge';
import { errorMessage } from '../errors';
import { formatMajor, formatMinor, formatNumber, formatPower } from '../format';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n';
import { ui } from '../ui';

/**
 * Core's connector statuses, type-checked against its DTO; importing Core's runtime enum would add
 * zod and all of Core's types to the driver pages.
 */
const OUT_OF_SERVICE: readonly NonNullable<Connector['status']>[] = ['Unavailable', 'Faulted'];

function isOutOfService(connector: Connector): boolean {
  return connector.status !== undefined && OUT_OF_SERVICE.includes(connector.status);
}

/** Leaves the app for Stripe's payment page. */
export const redirect = {
  to: (url: string) => window.location.assign(url),
};

export function Checkout({ evseId }: { evseId: number }) {
  const { t } = useI18n();
  const [offer, setOffer] = useState<EvseOffer | null>(null);
  const [loadError, setLoadError] = useState<MessageKey | null>(null);
  const [connectorId, setConnectorId] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    api.describeEvse(evseId).then(
      (loaded) => {
        if (current) {
          setOffer(loaded);
          setConnectorId(loaded.connectors.length === 1 ? loaded.connectors[0].id : null);
        }
      },
      (caught: unknown) =>
        current && setLoadError(errorMessage(caught, { 404: 'checkout.notFound' })),
    );
    return () => {
      current = false;
    };
  }, [evseId]);

  if (loadError) {
    return <Notice tone="error">{t(loadError)}</Notice>;
  }
  if (!offer) {
    return <Spinner />;
  }

  const connector = offer.connectors.find((candidate) => candidate.id === connectorId) ?? null;

  const onPay = async () => {
    if (!connector) {
      setError('checkout.chooseConnector');
      return;
    }
    if (offer.termsUrl && !accepted) {
      setError('checkout.termsRequired');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.createCheckout(offer.id, connector.id);
      redirect.to(url);
    } catch (caught) {
      setError(
        errorMessage(caught, {
          409: 'checkout.unavailable',
          422: 'checkout.notPayable',
          404: 'checkout.notFound',
        }),
      );
      setBusy(false);
    }
  };

  const blocked: MessageKey | null = !offer.payable
    ? 'checkout.notPayable'
    : !offer.stationOnline
      ? 'checkout.offline'
      : null;

  return (
    <>
      <EvseHeader evse={offer} connector={connector} />

      {offer.connectors.length > 1 && (
        <section className={ui.card}>
          <h2 className={ui.heading}>{t('checkout.chooseConnector')}</h2>
          <div className="grid gap-1.5" role="radiogroup">
            {offer.connectors.map((candidate, index) => (
              <ConnectorChoice
                key={candidate.id}
                connector={candidate}
                number={candidate.evseTypeConnectorId ?? candidate.connectorId ?? index + 1}
                selected={candidate.id === connectorId}
                onSelect={() => {
                  setConnectorId(candidate.id);
                  setError(null);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {connector && (
        <section className={ui.card}>
          {connector.tariff ? (
            <Tariff tariff={connector.tariff} />
          ) : (
            <Notice tone="info">{t('checkout.noTariff')}</Notice>
          )}
        </section>
      )}

      {blocked ? (
        <Notice tone="info">{t(blocked)}</Notice>
      ) : (
        <section className={ui.card}>
          <p>{t('checkout.plugIn')}</p>
          {offer.termsUrl && (
            <label className="flex items-start gap-2.5">
              <input
                className="mt-0.5 size-5 flex-none accent-primary"
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  setError(null);
                }}
              />
              <span>
                <TermsSentence termsUrl={offer.termsUrl} />
              </span>
            </label>
          )}
          {error && <Notice tone="error">{t(error)}</Notice>}
          <button
            type="button"
            className={ui.primaryButton}
            disabled={busy || !connector?.tariff || isOutOfService(connector)}
            onClick={onPay}
          >
            <BoltIcon /> {t('checkout.pay')}
          </button>
        </section>
      )}
    </>
  );
}

function ConnectorChoice({
  connector,
  number,
  selected,
  onSelect,
}: {
  connector: Connector;
  number: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { locale } = useI18n();
  const outOfService = isOutOfService(connector);
  const facts = [
    connector.maximumPowerWatts ? formatPower(connector.maximumPowerWatts, locale) : null,
    connector.type,
  ].filter(Boolean);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent disabled:opacity-50 ${selected ? 'border-primary ring-1 ring-primary' : 'border-input'}`}
      disabled={outOfService}
      onClick={onSelect}
    >
      <span className="shrink-0 font-semibold">{number}</span>
      <span className={`${ui.muted} min-w-0 flex-1 truncate`}>{facts.join(' · ')}</span>
      {connector.status && <StatusBadge status={connector.status} />}
    </button>
  );
}

function Tariff({ tariff }: { tariff: TariffSummary }) {
  const { t, locale } = useI18n();
  // The tariff's own figures, without VAT: the exact rates a session is priced at. VAT is added
  // to each part of the session's cost, so prices with VAT would only be approximations.
  const taxRate = tariff.taxRate ?? 0;
  const price = (net: number) => formatMajor(net, tariff.currency, locale);
  const lines: [string, number][] = [
    [t('checkout.perKwh'), tariff.pricePerKwh],
    [t('checkout.perMin'), tariff.pricePerMin ?? 0],
    [t('checkout.perSession'), tariff.pricePerSession ?? 0],
  ];
  return (
    <>
      <div className="space-y-0.5">
        <h2 className={ui.heading}>{t('checkout.tariff')}</h2>
        {taxRate > 0 && (
          <p className={`${ui.muted} ${ui.small}`}>
            {t('checkout.plusVat', { rate: formatNumber(taxRate, locale) })}
          </p>
        )}
      </div>
      <dl>
        {lines
          .filter(([, net]) => net > 0)
          .map(([label, net]) => (
            <div key={label} className="flex justify-between border-b border-border py-1.5">
              <dt className="font-semibold">{price(net)}</dt>
              <dd>{label}</dd>
            </div>
          ))}
      </dl>
      {tariff.authorizationAmount !== null && (
        <p className={ui.small}>
          {t('checkout.hold', {
            amount: formatMinor(tariff.authorizationAmount, tariff.currency, locale),
          })}
        </p>
      )}
    </>
  );
}

function TermsSentence({ termsUrl }: { termsUrl: string }) {
  const { t } = useI18n();
  const marker = '\u0000';
  const [before, after] = t('checkout.acceptTerms', { terms: marker }).split(marker);
  return (
    <>
      {before}
      <a
        href={/^https?:\/\//i.test(termsUrl) ? termsUrl : undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('checkout.terms')}
      </a>
      {after}
    </>
  );
}
