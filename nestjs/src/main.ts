import 'reflect-metadata';
// Load `.env` (and `.env.local` for local overrides) before any module
// reads `process.env`. Shell-exported vars take precedence — matches
// dotenv's default semantics.
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger, type LogLevel, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildConfig } from '@modules/config/app-config.module';
import { StructuredLogger } from '@logger/structured-logger';
import { initTelemetry } from '@telemetry/telemetry-bootstrap';

dotenv.config();
dotenv.config({ path: '.env.local', override: false });

const logger = new Logger('Bootstrap');

const VALID_LOG_LEVELS: ReadonlySet<LogLevel> = new Set([
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
]);

/**
 * Parse a `LOG_LEVEL` env value into a deduplicated, validated list of
 * NestJS log levels. Accepts a comma-separated subset (e.g. `error,warn`)
 * or a single canonical level name; falls back to the production-friendly
 * default `log,error,warn,debug` when unset / unparseable.
 */
function parseLogLevels(envValue: string | undefined): LogLevel[] {
  const fallback: LogLevel[] = ['log', 'error', 'warn', 'debug'];
  if (!envValue) return fallback;
  const requested = envValue
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) as LogLevel[];
  const valid = requested.filter((l) => VALID_LOG_LEVELS.has(l));
  return valid.length > 0 ? Array.from(new Set(valid)) : fallback;
}

async function bootstrap() {
  const config = buildConfig();

  // OTel SDK must be initialized before NestFactory so http/fastify
  // instrumentation can patch the modules at import time.
  const shutdownTelemetry = initTelemetry(config.util.telemetry);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.create(config),
    new FastifyAdapter({ logger: false }),
    {
      // One JSON object per log line. Async-local context (correlationId,
      // stationId, tenantId) is picked up automatically when handlers run
      // their work inside `withLogContext(...)`. Level set via `LOG_LEVEL`
      // env (comma-separated subset of `log,error,warn,debug,verbose`);
      // default omits `verbose` to keep prod logs concise.
      logger: new StructuredLogger(parseLogLevels(process.env.LOG_LEVEL)),
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  const swagger = config.util.swagger;
  if (swagger) {
    const doc = new DocumentBuilder()
      .setTitle('CitrineOS — Charging Station Management System')
      .setDescription(
        [
          'OCPP 1.6 / 2.0.1 / 2.1 CSMS API.',
          '',
          'Every endpoint under `/ocpp/{version}/{module}/{action}` is a',
          'CSMS-initiated CALL to a charger — the body is the OCPP request',
          "payload, and the response is the charger's CALL_RESULT awaited via",
          'the AMQP correlation cache.',
          '',
          'Charger-initiated CALLs (BootNotification, StatusNotification, ',
          'TransactionEvent, …) are not exposed here — they arrive on the OCPP',
          'WebSocket port (default 8081) and are processed by the appropriate',
          'module handler.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .setContact('CitrineOS', 'https://citrineos.github.io', 'support@citrineos.org')
      .setLicense('Apache-2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
      .setExternalDoc('Project documentation', '/documentation')
      .addServer(`http://localhost:${config.centralSystem.port ?? 8080}`, 'Local')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .addTag('Configuration', 'OCPP boot config, firmware, network profiles, display messages')
      .addTag('EVDriver', 'Auth tokens, reservations, local auth list, remote start/stop')
      .addTag('Transactions', 'Transaction lifecycle, meter values, status notifications, tariffs')
      .addTag('Monitoring', 'Variable get/set, monitoring base, variable monitoring')
      .addTag('Reporting', 'Get reports, log uploads, customer information')
      .addTag('SmartCharging', 'Charging profiles, composite schedules')
      .addTag('Certificates', 'Get installed certificates, install / delete certs, sign')
      .addTag('Tenant', 'Tenant management')
      .addTag('health', '/health composite check')
      .addTag('metrics', 'Prometheus /metrics exposition')
      .build();
    const document = SwaggerModule.createDocument(app, doc, {
      operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
    });
    SwaggerModule.setup(swagger.path ?? 'docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        displayRequestDuration: true,
        filter: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
      },
    });
  }

  const httpPort = config.centralSystem.port;
  const httpHost = config.centralSystem.host;
  await app.listen({ port: httpPort, host: httpHost });
  logger.log(`CitrineOS NestJS HTTP server listening on port ${httpPort}`);
  if (swagger) {
    logger.log(`Swagger UI: http://${httpHost}:${httpPort}${swagger.path ?? '/docs'}`);
  }

  // Flush in-flight spans on graceful shutdown.
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.once(sig, () => {
      void shutdownTelemetry().finally(() => process.exit(0));
    });
  }
}

bootstrap().catch(console.error);
