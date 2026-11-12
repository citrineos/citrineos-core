// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { getDatabaseConfigForEnv } from './loader.js';

/**
 * sequelize-cli's settings for this app's migrations: the same database as the server's, for the
 * APP_ENV it runs in (DB_HOST and so on, or `ocpp-db` in the docker stack). Not Core's bootstrap
 * config, which does not read this app's settings.
 */
export default (async () => {
  const { host, port, database, username, password } = getDatabaseConfigForEnv(process.env.APP_ENV);

  return {
    username,
    password,
    database,
    host,
    port,
    dialect: 'postgres',
    logging: true,
  };
})();
