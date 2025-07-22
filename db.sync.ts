process.env.APP_ENV = 'local'; // needs to be before systemConfig import - careful with prettier formatter!

import { DefaultSequelizeInstance } from '@citrineos/data';
import { getSystemConfig } from './Server/src/config/index.js';
import { loadBootstrapConfig } from '@citrineos/base';

async function initializeDatabase() {
  const bootstrapConfig = loadBootstrapConfig();
  const loadedSystemConfig = await getSystemConfig(bootstrapConfig);
  return DefaultSequelizeInstance.getInstance(loadedSystemConfig);
}

export const sequelize = initializeDatabase();

const syncDatabase = async () => {
  await (await sequelize).sync({ alter: true }); // Use { force: true } for dropping and recreating tables
  console.log('Database synchronized successfully');
};

syncDatabase()
  .then()
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });
