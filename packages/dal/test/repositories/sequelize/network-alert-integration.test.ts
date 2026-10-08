// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe } from 'vitest';
import type { SystemConfig } from '@citrineos/types';
import {
  SequelizeNetworkAlertConfigRepository,
  SequelizeNetworkAlertRepository,
} from '../../../index.js';
import { networkAlertRepositoryContract } from '../../utils/network-alert-repository-contract.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

let h: PgHarness;

beforeAll(async () => {
  h = await startPgHarness();
}, 90_000);

afterAll(async () => {
  await h.stop();
});

beforeEach(async () => {
  await resetDb(h);
});

function deps() {
  return { config: {} as SystemConfig, sequelizeInstance: h.sequelizeInstance };
}

describe('SequelizeNetworkAlertRepository', () => {
  networkAlertRepositoryContract(
    () => new SequelizeNetworkAlertRepository(deps()),
    () => new SequelizeNetworkAlertConfigRepository(deps()),
  );
});
