import { GenericContainer, Wait } from 'testcontainers';

export const DEFAULT_RABBITMQ_PORT = 5432;
export const DEFAULT_RABBITMQ_API_PORT = 15672;

export const getRabbitmqContainer = () =>
  new GenericContainer('rabbitmq:3-management-alpine')
    .withExposedPorts(DEFAULT_RABBITMQ_PORT, DEFAULT_RABBITMQ_API_PORT)
    .withWaitStrategy(Wait.forLogMessage('Server startup complete', 1))
    .start();
