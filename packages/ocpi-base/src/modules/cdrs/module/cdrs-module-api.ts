// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ICdrsModuleApi } from './i-cdrs-module-api.js';

import { Get, JsonController } from 'routing-controllers';
import { HttpStatus } from '@citrineos/base';
import type { PaginatedCdrResponse } from '../../../index.js';
import {
  AsOcpiFunctionalEndpoint,
  BaseController,
  CdrsService,
  FunctionalEndpointParams,
  generateMockOcpiPaginatedResponse,
  ModuleId,
  OcpiHeaders,
  Paginated,
  PaginatedCdrResponseSchema,
  PaginatedCdrResponseSchemaName,
  PaginatedParams,
  ResponseSchema,
  versionIdParam,
} from '../../../index.js';
import type { OcpiDependencies } from '../../../dependencies.js';

const MOCK_PAGINATED_CDRS = await generateMockOcpiPaginatedResponse(
  PaginatedCdrResponseSchema,
  PaginatedCdrResponseSchemaName,
  new PaginatedParams(),
);

export interface CdrsModuleApiDependencies extends OcpiDependencies {
  cdrsService: CdrsService;
}

@JsonController(`/:${versionIdParam}/${ModuleId.Cdrs}`)
export class CdrsModuleApi extends BaseController implements ICdrsModuleApi {
  readonly cdrsService: CdrsService;

  constructor(dependencies: CdrsModuleApiDependencies) {
    super(dependencies);
    this.cdrsService = dependencies.cdrsService;
  }

  @Get()
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(PaginatedCdrResponseSchema, PaginatedCdrResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_PAGINATED_CDRS,
    },
  })
  async getCdrs(
    @Paginated() paginationParams?: PaginatedParams,
    @FunctionalEndpointParams() ocpiHeaders?: OcpiHeaders,
  ): Promise<PaginatedCdrResponse> {
    return this.cdrsService.getCdrs(
      ocpiHeaders!.fromCountryCode,
      ocpiHeaders!.fromPartyId,
      ocpiHeaders!.toCountryCode,
      ocpiHeaders!.toPartyId,
      paginationParams?.dateFrom,
      paginationParams?.dateTo,
      paginationParams?.offset,
      paginationParams?.limit,
    );
  }
}
