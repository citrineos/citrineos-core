// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Provisions upcoming "OCPPMessages" weekly partitions. Runs on every container start,
 * because the partitioning migration runs once but partitions must keep being created.
 */
import { loadBootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize';

/** Weeks of partitions to keep ahead of the current one. */
const FUTURE_WEEKS = Number(process.env.OCPP_PARTITION_FUTURE_WEEKS ?? 1);

async function main(): Promise<void> {
  const { host, port, database, username, password, ssl } = loadBootstrapConfig().database;

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
    // Absent until the partitioning migration has run. Not an error: a deployment on the
    // pre-partitioning schema must still be able to start.
    const [[{ exists }]] = (await sequelize.query(
      `SELECT count(*) > 0 AS exists FROM pg_proc WHERE proname = 'rotate_ocpp_messages_partitions'`,
    )) as unknown as [[{ exists: boolean }]];

    if (!exists) {
      console.log('[provision-partitions] procedure not present — skipping');
      return;
    }

    // Partition bounds are timestamptz literals and date_trunc('week', ...) resolves against
    // the session timezone, so this must run in UTC or boundaries land on local midnight.
    await sequelize.query(`SET timezone = 'UTC'`);

    // retain_weeks is deliberately absurd: it puts the drop cutoff ~190 years in the past so
    // nothing qualifies, making this provision-only. Dropping partitions destroys data and
    // belongs to the maintenance job that archives first, never to application startup.
    await sequelize.query(`CALL rotate_ocpp_messages_partitions(9999, ${FUTURE_WEEKS}, false)`);

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
  // week means every message insert fails.
  console.error('[provision-partitions] failed:', error);
  process.exit(1);
});
