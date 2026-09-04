// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Provisions upcoming partitions: "OCPPMessages" weekly, the "Transactions" cluster
 * monthly. Runs on every container start, because the partitioning migrations run once
 * but partitions must keep being created.
 */
import { ConfigLoader } from '@citrineos/base';
import { Sequelize } from 'sequelize';

/** Weeks of "OCPPMessages" partitions to keep ahead of the current one. */
const FUTURE_WEEKS = Number(process.env.OCPP_PARTITION_FUTURE_WEEKS ?? 1);

/**
 * Months of "Transactions" cluster partitions to keep ahead of the current one. Nothing but
 * a pod start provisions this cluster, so 1 leaves a runway of only until the end of next
 * month; raise it where deployments run for longer than that without restarting.
 */
const FUTURE_MONTHS = Number(process.env.TRANSACTION_PARTITION_FUTURE_MONTHS ?? 1);

/**
 * retain is deliberately absurd: it puts the drop cutoff ~190 years in the past so nothing
 * qualifies, making the call provision-only. Dropping partitions destroys data and belongs
 * to the maintenance job that archives first, never to application startup.
 */
const NEVER_DROP = 9999;

/** Skips silently when the procedure is absent. A pre-partitioning schema must still start. */
async function rotate(sequelize: Sequelize, procedure: string, future: number): Promise<boolean> {
  const [[{ exists }]] = (await sequelize.query(
    `SELECT count(*) > 0 AS exists FROM pg_proc WHERE proname = :procedure`,
    { replacements: { procedure } },
  )) as unknown as [[{ exists: boolean }]];

  if (!exists) {
    console.log(`[provision-partitions] ${procedure} not present — skipping`);
    return false;
  }
  await sequelize.query(`CALL ${procedure}(${NEVER_DROP}, ${future}, false)`);
  return true;
}

async function main(): Promise<void> {
  const { host, port, database, username, password, ssl } = (await ConfigLoader.loadConfig())
    .database;

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host,
    port,
    database,
    username,
    password,
    ...(ssl && { dialectOptions: { ssl } }),
    logging: false,
  });

  try {
    // Partition bounds are timestamptz literals and date_trunc() resolves against the
    // session timezone, so this must run in UTC or boundaries land on local midnight.
    await sequelize.query(`SET timezone = 'UTC'`);

    await rotate(sequelize, 'rotate_transactions_partitions', FUTURE_MONTHS);

    if (!(await rotate(sequelize, 'rotate_ocpp_messages_partitions', FUTURE_WEEKS))) {
      return;
    }

    const [rows] = (await sequelize.query(
      `SELECT count(*)::int AS weeks
         FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
        WHERE i.inhparent = '"OCPPMessages"'::regclass
          AND c.relname ~ '^OCPPMessages_[0-9]{4}w[0-9]{2}$'
          AND to_date(right(c.relname, 7), 'IYYY"w"IW') >= date_trunc('week', now())::date`,
    )) as unknown as [{ weeks: number }[]];

    console.log(`[provision-partitions] future weeks available: ${rows[0]?.weeks ?? 0}`);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  // Fail loudly: with no DEFAULT partition, starting without a partition for the current
  // period means every insert into a partitioned table fails.
  console.error('[provision-partitions] failed:', error);
  process.exit(1);
});
