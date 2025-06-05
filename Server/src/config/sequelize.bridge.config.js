require('ts-node/register');

module.exports = (async () => {
  const { systemConfig: SystemConfigPromise } = require('./index');

  try {
    const systemConfig = await SystemConfigPromise;

    const { host, port, database, dialect, username, password, storage } =
      systemConfig.data.sequelize;

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
      storage,
      logging: true,
    };
  } catch (error) {
    console.error('[sequelize.bridge.config.js] Failed to load system configuration:', error);
    throw error;
  }
})();
