# @citrineos/observability

Opt-in OpenTelemetry metrics export for CitrineOS servers.

CitrineOS packages record their metrics through `@opentelemetry/api`. The API does nothing until a
process registers a `MeterProvider`, and this package is what registers one: it serves every
CitrineOS instrument, plus event-loop delay and utilization gauges, on a Prometheus endpoint.

Metrics are **off by default**. Configuration, the metrics that are exported and how to scrape them
are documented for the OCPP server in
[apps/ocpp-server/README.md](../../apps/ocpp-server/README.md#metrics).

## Using it in a server

The OpenTelemetry metrics API has no proxy provider: a meter obtained before a provider is
registered stays a no-op for the life of the process. CitrineOS packages create their instruments
when their modules load, so the provider has to be registered before any other `@citrineos/*`
package is imported. Do it from a module of its own, imported first by the entrypoint:

```ts
// instrumentation.ts
import { initMetricsFromEnv } from '@citrineos/observability';

initMetricsFromEnv({ serviceName: 'my-csms' });
```

```ts
// index.ts
import './instrumentation.js'; // must be the first import

import { shutdownMetrics } from '@citrineos/observability';
import { CitrineOSServer } from '@citrineos/ocpp';

class Server extends CitrineOSServer {
  protected override async onShutdown(): Promise<void> {
    await shutdownMetrics();
  }
}
```

`initMetricsFromEnv` is synchronous, so ESM evaluates it completely before the imports that follow
it. The `onShutdown()` hook closes the metrics endpoint; without it, the open port keeps the process
alive until the shutdown grace period forces it to exit.
