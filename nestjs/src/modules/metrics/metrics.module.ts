// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { MetricsController } from '@metrics/metrics.controller';
import { MetricsService } from '@metrics/metrics.service';

/**
 * Counter + gauge registry exposed at `/metrics`. `@Global()` so any
 * service can inject `MetricsService` and increment/set without each
 * domain module having to import this one.
 */
@Global()
@Module({
  providers: [MetricsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
