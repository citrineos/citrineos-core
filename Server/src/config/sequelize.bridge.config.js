require('ts-node/register');

module.exports = (async () => {
  const { loadBootstrapConfig } = require('./bootstrap.config');

  try {
    const bootstrapConfig = loadBootstrapConfig();

    const { host, port, database, dialect, username, password } = bootstrapConfig.database;

    console.log('[sequelize.bridge.config.js] Loaded config for DB:', {
      host,
      port,
      database,
      dialect,
    });

    return {
      username,
      password,
      database,
      host,
      port,
      dialect,
      logging: true,
    };
  } catch (error) {
    console.error('[sequelize.bridge.config.js] Failed to load bootstrap configuration:', error);
    throw error;
  }
})();
