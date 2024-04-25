// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type SystemConfig } from '@citrineos/base';
import { createDockerConfig } from './envs/docker';

export const systemConfig: SystemConfig = getConfig();

function getConfig(): SystemConfig {
  switch (process.env.APP_ENV) {
    case 'docker':
      return createDockerConfig();
    default:
      throw new Error(`Invalid APP_ENV "${process.env.APP_ENV}"`);
  }
}
