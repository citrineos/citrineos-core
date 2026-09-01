// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Runs once before the live files: make sure the mock answers, then start from
// a clean recorder (registration kept, scenario re-applied).
import { BASE, ctlDelete, health, resetKeepingScenario, sleep } from './live-client.js';

export default async function setup(): Promise<void> {
  const deadline = Date.now() + 60_000;
  for (;;) {
    try {
      const h = await health();
      if (h.status === 'up') break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`no mock answering on ${BASE}/_mock/health`);
    await sleep(1000);
  }
  await ctlDelete('/findings');
  await resetKeepingScenario(process.env.MOCK_MSP_LIVE_SCENARIO ?? 'preregistered');
}
