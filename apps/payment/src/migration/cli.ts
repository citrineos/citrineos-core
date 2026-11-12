// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import Stripe from 'stripe';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { getDatabaseConfigForEnv } from '../config/loader.js';
import { RuntimeEnv } from '../config/types.js';
import { initializeDatabase } from '../db/database.js';
import { SequelizePaymentAccountRepository } from '../repositories/index.js';
import { applyPlan, OpenPythonCheckoutsError } from './apply.js';
import { readCoreSnapshot } from './core-snapshot.js';
import { planMigration } from './plan.js';
import { readPythonData } from './python-source.js';
import { formatReport } from './report.js';
import { checkStripe, stripeLookup } from './stripe-check.js';
import { AccountAction } from './types.js';

const USAGE = `Moves a citrineos-payment (Python) installation onto this app.

  node dist/migration/cli.js [--source <postgres url>] [--prefix <table prefix>] [--apply]

  --source                    the Python service's database; default: this app's, which is Core's,
                              where the Python service kept its tables too
  --prefix                    its DB_TABLE_PREFIX; default: payment_
  --python-id-token-prefix    its OCPP_REMOTESTART_IDTAG_PREFIX; default: this app's
  --id-token-prefix           this app's PAYMENT_ID_TOKEN_PREFIX; default: that variable, or PAY_
  --public-url                this app's PAYMENT_PUBLIC_URL, for the new QR codes; default: that
                              variable, or http://localhost:9010
  --stripe-api-key            the Stripe platform key, to ask which payments are still held and
                              that every operator's account is connected; default: STRIPE_API_KEY.
                              Read-only; without it, Stripe is not asked
  --scan-and-charge           turn scan and charge on for the accounts created (CITRINEOS_SCAN_AND_CHARGE)
  --json <file>               also write the plan as JSON
  --apply                     make the changes; without it, only report them. Refused while
                              sessions the Python service took payment for are still charging
  --ignore-open-checkouts     apply anyway, e.g. when a person will settle those sessions

Exits 2 when an account needs deciding by hand, 3 when --apply was refused for charging sessions.

The database settings come from DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASS, as for the server.
Only payment accounts and the checkout id sequence are changed; what differs in Core, and the QR
codes to print, are reported.
`;

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      source: { type: 'string' },
      prefix: { type: 'string', default: 'payment_' },
      'python-id-token-prefix': { type: 'string' },
      'id-token-prefix': { type: 'string', default: process.env.PAYMENT_ID_TOKEN_PREFIX || 'PAY_' },
      'public-url': {
        type: 'string',
        default: process.env.PAYMENT_PUBLIC_URL || 'http://localhost:9010',
      },
      'stripe-api-key': { type: 'string', default: process.env.STRIPE_API_KEY ?? '' },
      'ignore-open-checkouts': { type: 'boolean', default: false },
      'scan-and-charge': { type: 'boolean', default: false },
      json: { type: 'string' },
      apply: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  const database = getDatabaseConfigForEnv(process.env.APP_ENV);
  const source =
    values.source ??
    `postgres://${encodeURIComponent(database.username)}:${encodeURIComponent(database.password)}@${database.host}:${database.port}/${database.database}`;

  const python = await readPythonData(source, values.prefix);
  const stripeKey = values['stripe-api-key'];
  const stripe = stripeKey
    ? await checkStripe(
        stripeLookup(new Stripe(stripeKey)),
        python.operators.map((operator) => operator.stripeAccountId),
        python.paidCheckouts,
      )
    : undefined;
  // Warnings and errors only: the report is the output.
  const logger = new Logger<ILogObj>({ name: 'Python migration', minLevel: 4 });
  const sequelize = await initializeDatabase({ env: RuntimeEnv.Development, database }, logger);
  try {
    const core = await readCoreSnapshot(sequelize, values['id-token-prefix']);
    const plan = planMigration(python, core, {
      publicUrl: values['public-url'],
      pythonIdTokenPrefix: values['python-id-token-prefix'] ?? values['id-token-prefix'],
      idTokenPrefix: values['id-token-prefix'],
      stripe,
    });
    let applied = false;
    if (values.apply) {
      try {
        await applyPlan(plan, sequelize, new SequelizePaymentAccountRepository(), {
          scanAndChargeEnabled: values['scan-and-charge'],
          ignoreOpenPythonCheckouts: values['ignore-open-checkouts'],
        });
        applied = true;
      } catch (error) {
        if (!(error instanceof OpenPythonCheckoutsError)) {
          throw error;
        }
        process.stderr.write(`Not applied: ${error.message}\n\n`);
      }
    }
    process.stdout.write(formatReport(plan, applied));
    if (values.json) {
      writeFileSync(values.json, JSON.stringify(plan, null, 2));
    }
    if (values.apply && !applied) {
      return 3;
    }
    return plan.accounts.some((account) => account.action === AccountAction.Conflict) ? 2 : 0;
  } finally {
    await sequelize.close();
  }
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
