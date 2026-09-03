// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ISessionsModuleApi } from './i-sessions-module-api.js';
import { Get, JsonController, Param, Put } from 'routing-controllers';
import { HttpStatus } from '@citrineos/base';
import type {
  ChargingPreferences,
  ChargingPreferencesResponse,
  PaginatedSessionResponse,
} from '../../../index.js';
import {
  AsOcpiFunctionalEndpoint,
  BaseController,
  BodyWithSchema,
  ChargingPreferencesResponseSchema,
  ChargingPreferencesResponseSchemaName,
  ChargingPreferencesSchema,
  ChargingPreferencesSchemaName,
  FunctionalEndpointParams,
  generateMockForSchema,
  generateMockOcpiPaginatedResponse,
  ModuleId,
  OcpiHeaders,
  Paginated,
  PaginatedParams,
  PaginatedSessionResponseSchema,
  PaginatedSessionResponseSchemaName,
  ResponseSchema,
  SessionsService,
  versionIdParam,
  VersionNumber,
  VersionNumberParam,
} from '../../../index.js';
import type { OcpiDependencies } from '../../../dependencies.js';

const MOCK_PAGINATED_SESSIONS = await generateMockOcpiPaginatedResponse(
  PaginatedSessionResponseSchema,
  PaginatedSessionResponseSchemaName,
  new PaginatedParams(),
);
const MOCK_CHARGING_PREFERENCES = await generateMockForSchema(
  ChargingPreferencesResponseSchema,
  ChargingPreferencesResponseSchemaName,
);

export interface SessionsModuleApiDependencies extends OcpiDependencies {
  sessionsService: SessionsService;
}

@JsonController(`/:${versionIdParam}/${ModuleId.Sessions}`)
export class SessionsModuleApi extends BaseController implements ISessionsModuleApi {
  readonly sessionsService: SessionsService;

  constructor(dependencies: SessionsModuleApiDependencies) {
    super(dependencies);
    this.sessionsService = dependencies.sessionsService;
  }

  @Get()
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(PaginatedSessionResponseSchema, PaginatedSessionResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_PAGINATED_SESSIONS,
    },
  })
  async getSessions(
    @VersionNumberParam() versionNumber: VersionNumber,
    @Paginated() paginatedParams?: PaginatedParams,
    @FunctionalEndpointParams() ocpiHeaders?: OcpiHeaders,
  ): Promise<PaginatedSessionResponse> {
    return this.sessionsService.getSessions(
      ocpiHeaders!.fromCountryCode,
      ocpiHeaders!.fromPartyId,
      ocpiHeaders!.toCountryCode,
      ocpiHeaders!.toPartyId,
      paginatedParams?.dateFrom,
      paginatedParams?.dateTo,
      paginatedParams?.offset,
      paginatedParams?.limit,
    );
  }

  @Put('/{sessionId}/charging_preferences')
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(ChargingPreferencesResponseSchema, ChargingPreferencesResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_CHARGING_PREFERENCES,
    },
  })
  async updateChargingPreferences(
    @Param('sessionId') sessionId: string,
    @BodyWithSchema(ChargingPreferencesSchema, ChargingPreferencesSchemaName)
    body: ChargingPreferences,
  ): Promise<ChargingPreferencesResponse> {
    console.log('updateChargingPreferences', sessionId, body);
    return MOCK_CHARGING_PREFERENCES;
  }
}
