// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ITariffsModuleApi } from './ITariffsModuleApi.js';
import { Get, JsonController } from 'routing-controllers';
import { HttpStatus } from '@citrineos/base';
import type { PaginatedTariffResponse } from '../../../index.js';
import {
  AsOcpiFunctionalEndpoint,
  BaseController,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  FunctionalEndpointParams,
  generateMockForSchema,
  ModuleId,
  OcpiHeaders,
  OcpiResponseStatusCode,
  Paginated,
  PaginatedParams,
  PaginatedTariffResponseSchema,
  PaginatedTariffResponseSchemaName,
  ResponseSchema,
  TariffsService,
  versionIdParam,
  VersionNumber,
  VersionNumberParam,
} from '../../../index.js';
import { Service } from 'typedi';

const MOCK_PAGINATED_TARIFF = await generateMockForSchema(
  PaginatedTariffResponseSchema,
  PaginatedTariffResponseSchemaName,
);

@Service()
@JsonController(`/:${versionIdParam}/${ModuleId.Tariffs}`)
export class TariffsModuleApi extends BaseController implements ITariffsModuleApi {
  constructor(
    readonly tariffService: TariffsService,
    // readonly tariffsPublisher: TariffsBroadcaster,
  ) {
    super();
  }

  @Get()
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(PaginatedTariffResponseSchema, PaginatedTariffResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_PAGINATED_TARIFF,
    },
  })
  async getTariffs(
    @VersionNumberParam() version: VersionNumber,
    @FunctionalEndpointParams() ocpiHeaders: OcpiHeaders,
    @Paginated() paginationParams?: PaginatedParams,
  ): Promise<PaginatedTariffResponse> {
    console.log(`GET /tariffs ${JSON.stringify(paginationParams)}, ${JSON.stringify(ocpiHeaders)}`);
    const { data, count } = await this.tariffService.getTariffs(ocpiHeaders, paginationParams);

    return {
      data: data,
      total: count,
      offset: paginationParams?.offset || DEFAULT_OFFSET,
      limit: paginationParams?.limit || DEFAULT_LIMIT,
      status_code: OcpiResponseStatusCode.GenericSuccessCode,
      timestamp: new Date(),
    };
  }

  // TODO: auth & reorganize
  // @Post(`/tariff-broadcasts`)
  // async broadcastTariff(
  //   @Body()
  //   broadcastRequest: TariffKey & {
  //     eventType: 'created' | 'updated' | 'deleted';
  //   },
  // ): Promise<void> {
  //   console.log(`POST /tariff-broadcasts ${JSON.stringify(broadcastRequest)}`);

  //   switch (broadcastRequest.eventType) {
  //     case 'deleted':
  //       return this.tariffsPublisher.broadcastDeletionByKey(broadcastRequest);
  //     case 'updated':
  //       return this.tariffsPublisher.broadcastByKey(broadcastRequest);
  //     case 'created':
  //       return this.tariffsPublisher.broadcastByKey(broadcastRequest);
  //     default:
  //       throw new Error(`Unsupported event type ${broadcastRequest.eventType}`);
  //   }
  // }

  /**
   * Admin Endpoints
   */

  // @Put()
  // async updateTariff(
  //   @Body(PutTariffRequestSchema, PutTariffRequestSchemaName)
  //   tariffDto: PutTariffRequest,
  // ): Promise<TariffDTO> {
  //   return await this.tariffService.createOrUpdateTariff(tariffDto);
  // }

  // @Delete('/:tariffId')
  // async deleteTariff(
  //   @Param('tariffId') tariffId: number,
  // ): Promise<OcpiEmptyResponse | OcpiErrorResponse> {
  //   if (!tariffId) {
  //     return buildOcpiErrorResponse(
  //       OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
  //       'No tariff id provided',
  //     );
  //   }

  //   await this.tariffService.deleteTariff(tariffId);
  //   return buildOcpiEmptyResponse(OcpiResponseStatusCode.GenericSuccessCode);
  // }
}
