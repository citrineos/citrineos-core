// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MigrationPlan, PythonSession, TariffValues } from './types.js';
import { AccountAction, Comparison, TariffMatch } from './types.js';

function prices(tariff: TariffValues): string {
  return [
    `${tariff.currency}`,
    `${tariff.pricePerKwh ?? 0}/kWh`,
    `${tariff.pricePerMin ?? 0}/min`,
    `${tariff.pricePerSession ?? 0}/session`,
    `VAT ${tariff.taxRate ?? 0}%`,
    `hold ${tariff.authorizationAmount ?? 'none'}`,
    `payment fee ${tariff.paymentFee ?? 'none'}`,
  ].join(', ');
}

function session(item: PythonSession): string {
  const where = item.stationId ? `, station ${item.stationId}` : '';
  const account = item.stripeAccountId ? ` on ${item.stripeAccountId}` : '';
  return `  - checkout ${item.checkoutId}${where}: payment intent ${item.paymentIntentId}${account}`;
}

/** The plan as a person reads it: what --apply does, and what is left to do before switching. */
export function formatReport(plan: MigrationPlan, applied: boolean): string {
  const lines: string[] = [];
  const out = (line = '') => lines.push(line);

  out(
    applied
      ? '# Migration from citrineos-payment: applied'
      : '# Migration from citrineos-payment: dry run',
  );
  out();
  out('## Sessions paid on the Python service');
  const sessions = plan.pythonSessions;
  if (!sessions.stripeChecked) {
    out(
      '- Stripe was not asked (set STRIPE_API_KEY): sessions the Python service saw end are assumed captured',
    );
  }
  if (!sessions.running.length && !sessions.toSettleByHand.length && !sessions.unverified.length) {
    out("- none: it holds no driver's money");
  }
  if (sessions.running.length) {
    out(
      `- ${sessions.running.length} still charging. The Python service captures them when they end: keep it ` +
        'running, with no new checkouts, until then. --apply refuses until they are done.',
    );
    sessions.running.forEach((item) => out(session(item)));
  }
  if (sessions.toSettleByHand.length) {
    out(
      `- ${sessions.toSettleByHand.length} held on Stripe with no session charging. The Python service will not ` +
        "settle them: capture the session's cost or cancel each in the Stripe Dashboard, or Stripe cancels " +
        'it 7 days after the payment.',
    );
    sessions.toSettleByHand.forEach((item) => out(session(item)));
  }
  if (sessions.unverified.length) {
    out(
      `- ${sessions.unverified.length} paid, not ended in the Python service and not charging in Core. Check ` +
        'each in the Stripe Dashboard and capture or cancel any still uncaptured.',
    );
    sessions.unverified.forEach((item) => out(session(item)));
  }

  out();
  out('## Payment accounts');
  if (!plan.accounts.length) {
    out('- none found');
  }
  for (const account of plan.accounts) {
    const who = `tenant ${account.tenantId}: ${account.stripeAccountId} (${account.operators.join(', ')})`;
    switch (account.action) {
      case AccountAction.Create:
        out(`- ${applied ? 'created' : 'to create'} — ${who}`);
        break;
      case AccountAction.Exists:
        out(`- already set — ${who}`);
        break;
      case AccountAction.Conflict:
        out(
          `- CONFLICT — ${who}: ${account.reason}. Set it with PUT /api/admin/tenants/${account.tenantId}/payment-account`,
        );
        break;
    }
  }

  out();
  out('## Checkout ids');
  out(
    plan.checkoutSequence
      ? `- ${applied ? 'moved' : 'to move'} from ${plan.checkoutSequence.current} to ${plan.checkoutSequence.next}, past every id an old checkout's idToken used`
      : '- already past every id an old checkout used',
  );
  if (!plan.idTokenPrefixesMatch) {
    out(
      "- the Python service's idTokens start differently from this app's, so its checkout ids cannot collide with new ones",
    );
  }

  out();
  out('## QR codes to print');
  const matched = plan.evses.filter((evse) => evse.qrCodeUrl !== null);
  if (!matched.length) {
    out('- none: no EVSE was found in Core');
  } else {
    out(
      "- The Python service's QR codes point at its own pages and stop working when it does. Replace them with:",
    );
    matched.forEach((evse) =>
      out(`  - ${evse.emi3EvseId} (station ${evse.stationId}): ${evse.qrCodeUrl}`),
    );
  }

  const todo: string[] = [];
  const ok: string[] = [];
  const stationsWithAddress = new Set<string>();
  for (const evse of plan.evses) {
    const where = `${evse.emi3EvseId} (station ${evse.stationId}, tenant ${evse.tenantId ?? '?'})`;
    if (evse.unmatched) {
      todo.push(`- ${where}: not in Core — ${evse.unmatched}`);
      continue;
    }
    if (evse.emi3?.status === Comparison.Missing) {
      todo.push(
        `- ${where}: set Core EVSE ${evse.coreEvseId}'s evseId to ${evse.emi3EvseId}, so drivers who type the printed EVSE ID find it`,
      );
    } else if (evse.emi3?.status === Comparison.Differs) {
      todo.push(
        `- ${where}: Core EVSE ${evse.coreEvseId} is ${evse.emi3.core}; drivers who type the printed ${evse.emi3EvseId} will not find it`,
      );
    }
    if (evse.address && !stationsWithAddress.has(evse.stationId)) {
      stationsWithAddress.add(evse.stationId);
      const station = `- station ${evse.stationId} (tenant ${evse.tenantId ?? '?'})`;
      const before = evse.address.python
        ? `; the Python service showed ${evse.address.python}`
        : '';
      if (evse.address.status === Comparison.Missing) {
        todo.push(`${station}: has no location in Core, so drivers see no address${before}`);
      } else if (evse.address.status === Comparison.Differs) {
        todo.push(`${station}: drivers now see ${evse.address.core ?? 'no address'}${before}`);
      }
    }
    for (const connector of evse.connectors) {
      const at = `${where}, connector ${connector.pythonConnectorId}`;
      const tariff = connector.tariff;
      switch (tariff.status) {
        case TariffMatch.Unmatched:
          todo.push(`- ${at}: no such connector in Core`);
          break;
        case TariffMatch.NoPythonTariff:
          ok.push(`- ${at}: had no tariff`);
          break;
        case TariffMatch.Missing:
          todo.push(
            `- ${at}: Core connector ${connector.coreConnectorId} has no tariff; the Python one was ${prices(tariff.python)}`,
          );
          break;
        case TariffMatch.Differs:
          todo.push(
            `- ${at}: Core tariff ${tariff.coreTariffId} differs — ${tariff.differences.join('; ')}`,
          );
          break;
        case TariffMatch.Same:
          ok.push(`- ${at}: Core tariff ${tariff.coreTariffId} matches`);
          break;
      }
    }
  }
  for (const names of plan.operatorNames) {
    const python = names.pythonOperators.join(', ');
    todo.push(
      names.shownToDrivers === null
        ? `- tenant ${names.tenantId}: drivers see no operator name, as it is the default tenant; the Python service showed ${python}`
        : `- tenant ${names.tenantId}: drivers now see "${names.shownToDrivers}" as the operator, where the Python service showed ${python}; rename the tenant if that is not right`,
    );
  }

  out();
  out('## To do in Core');
  if (!todo.length) {
    out('- nothing');
  }
  todo.forEach((line) => out(line));
  out();
  out('## Already matching');
  if (!ok.length) {
    out('- nothing');
  }
  ok.forEach((line) => out(line));
  if (plan.warnings.length) {
    out();
    out('## Warnings');
    plan.warnings.forEach((warning) => out(`- ${warning}`));
  }
  return lines.join('\n') + '\n';
}
