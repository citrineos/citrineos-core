// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FormEvent } from 'react';
import { useState } from 'react';
import { api } from '../api';
import { Notice } from '../components/layout';
import { errorMessage } from '../errors';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n';
import { navigate } from '../router';
import { ui } from '../ui';

export function Home() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError('home.missing');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { evseId } = await api.findEvse(query.trim());
      navigate(`/checkout/${evseId}`);
    } catch (caught) {
      setError(errorMessage(caught, { 404: 'home.notFound', 400: 'home.notFound' }));
      setBusy(false);
    }
  };

  return (
    <section className={ui.card}>
      <p className="text-lg font-semibold">{t('app.tagline')}</p>
      <p>{t('home.instructions')}</p>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <label htmlFor="evse-id" className="mb-1.5 block font-semibold">
          {t('home.evseId')}
        </label>
        <input
          id="evse-id"
          className="w-full rounded-lg border border-input bg-card p-3 text-lg uppercase text-foreground focus:outline-2 focus:outline-ring"
          name="evseId"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="US*ABC*E1234"
          value={query}
          maxLength={64}
          onChange={(event) => setQuery(event.target.value)}
          aria-invalid={error !== null}
        />
        {error && <Notice tone="error">{t(error)}</Notice>}
        <button type="submit" className={ui.primaryButton} disabled={busy}>
          {t('action.continue')}
        </button>
      </form>
    </section>
  );
}
