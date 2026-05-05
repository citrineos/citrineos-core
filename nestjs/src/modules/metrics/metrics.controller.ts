// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricsService } from '@metrics/metrics.service';

/**
 * Prometheus scrape endpoint. Returns the full counter + gauge registry
 * in the standard exposition text format.
 */
@ApiTags('metrics')
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  @ApiOperation({ summary: 'Prometheus-format metrics' })
  scrape(): string {
    return this.metrics.render();
  }
}
