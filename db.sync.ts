process.env.APP_ENV = 'local'; // needs to be before systemConfig import - careful with prettier formatter!

import { DefaultSequelizeInstance } from '@citrineos/data';
import { systemConfig } from './Server/src/config';

const sequelize = DefaultSequelizeInstance.getInstance(systemConfig);

const syncDatabase = async () => {
  await sequelize.sync({ alter: true }); // Use { force: true } for dropping and recreating tables
  console.log('Database synchronized successfully');
};

syncDatabase()
  .then()
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });
