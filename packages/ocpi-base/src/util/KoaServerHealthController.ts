// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Get, JsonController } from 'routing-controllers';
import { Service } from 'typedi';

@JsonController()
@Service()
export class HealthController {
  @Get('/health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
