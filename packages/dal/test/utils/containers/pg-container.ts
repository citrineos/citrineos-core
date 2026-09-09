import { GenericContainer, Wait } from 'testcontainers';

const DEFAULT_PG_CREDS = 'postgres';
export const DEFAULT_PG_PORT = 5432;
export const getDefaultPgClientConfig = (port: number) => ({
  host: 'localhost',
  port: port,
  database: DEFAULT_PG_CREDS,
  user: DEFAULT_PG_CREDS,
  password: DEFAULT_PG_CREDS,
});

export const getPgContainer = () =>
  new GenericContainer('postgis/postgis:16-3.5')
    .withEnvironment({
      POSTGRES_USER: DEFAULT_PG_CREDS,
      POSTGRES_PASSWORD: DEFAULT_PG_CREDS,
      POSTGRES_DB: DEFAULT_PG_CREDS,
    })
    .withExposedPorts(DEFAULT_PG_PORT)
    // postgis/postgis restarts postgres after running PostGIS init scripts,
    // so "ready to accept connections" appears twice. Wait for the second.
    .withWaitStrategy(Wait.forLogMessage('ready to accept connections', 2))
    .start();
