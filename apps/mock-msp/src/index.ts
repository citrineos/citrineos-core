// ============================================================================
// FILE: apps/mock-msp/src/index.ts   (integrate owner)
// Entrypoint: loadConfig -> buildContext -> buildServer -> listen(:8083).
// If a scenario is configured it is loaded + applied before listen; if the
// scenario is 'unregistered' and autoRegister is on, the Actor drives the
// mock-initiated credentials handshake against Citrine after the port is up.
// ============================================================================
import { loadConfig } from './config.js';
import { buildContext } from './context.js';
import { buildServer } from './server.js';
import { loadScenario, applyScenario } from './control/scenario.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const ctx = buildContext(config);

  // Apply a scenario (registration state, authorize policy, faults) before boot.
  if (config.scenarioPath) {
    try {
      const scn = loadScenario(config.scenarioPath);
      applyScenario(ctx, scn);
      ctx.log.child({ scenario: scn.name });
    } catch (err) {
      console.error(`mock-msp: failed to load scenario ${config.scenarioPath}:`, err);
      process.exit(1);
    }
  }

  const app = buildServer(ctx);
  await app.listen({ port: config.port, host: config.host });
  app.log.info(
    {
      port: config.port,
      party: `${ctx.identity.country_code}/${ctx.identity.party_id}`,
      registration: ctx.store.domain.registration.status,
      scenario: config.scenarioPath,
    },
    'mock-msp listening',
  );

  // Optional auto-registration: only when explicitly requested AND we are not
  // already registered (a preregistered scenario adopts the seed tokens).
  if (config.autoRegister && ctx.store.domain.registration.status !== 'registered') {
    try {
      await ctx.client.register();
      app.log.info('mock-msp auto-registration complete');
    } catch (err) {
      app.log.error({ err }, 'mock-msp auto-registration failed (server still up)');
    }
  }
}

main().catch((err) => {
  console.error('mock-msp failed to start', err);
  process.exit(1);
});
