// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IChargingProfilesModuleApi } from './IChargingProfilesModuleApi.js';
import { Delete, Get, JsonController, Param, Put, QueryParam } from 'routing-controllers';

import { HttpStatus } from '@citrineos/base';
import type { ChargingProfileResponse, SetChargingProfile } from '../../../index.js';
import {
  AsOcpiFunctionalEndpoint,
  BaseController,
  BodyWithSchema,
  ChargingProfileResponseSchema,
  ChargingProfileResponseSchemaName,
  ChargingProfilesService,
  generateMockForSchema,
  ModuleId,
  ResponseSchema,
  SetChargingProfileSchema,
  SetChargingProfileSchemaName,
  versionIdParam,
} from '../../../index.js';
import type { OcpiDependencies } from '../../../dependencies.js';

const MOCK_CHARGING_PROFILE_RESPONSE = await generateMockForSchema(
  ChargingProfileResponseSchema,
  ChargingProfileResponseSchemaName,
);

export interface ChargingProfilesModuleApiDependencies extends OcpiDependencies {
  chargingProfilesService: ChargingProfilesService;
}

@JsonController(`/:${versionIdParam}/${ModuleId.ChargingProfiles}`)
export class ChargingProfilesModuleApi
  extends BaseController
  implements IChargingProfilesModuleApi
{
  readonly chargingProfilesService: ChargingProfilesService;

  constructor(dependencies: ChargingProfilesModuleApiDependencies) {
    super(dependencies);
    this.chargingProfilesService = dependencies.chargingProfilesService;
  }

  @Get('/:sessionId')
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(ChargingProfileResponseSchema, ChargingProfileResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_CHARGING_PROFILE_RESPONSE,
    },
  })
  async getActiveChargingProfile(
    @Param('sessionId') sessionId: string,
    @QueryParam('duration', { required: true }) duration: number,
    @QueryParam('response_url', { required: true }) responseUrl: string,
  ): Promise<ChargingProfileResponse> {
    return this.chargingProfilesService.getActiveChargingProfile(sessionId, duration, responseUrl);
  }

  @Delete('/:sessionId')
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(ChargingProfileResponseSchema, ChargingProfileResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_CHARGING_PROFILE_RESPONSE,
    },
  })
  async deleteChargingProfile(
    @Param('sessionId') sessionId: string,
    @QueryParam('response_url', { required: true }) responseUrl: string,
  ): Promise<ChargingProfileResponse> {
    return this.chargingProfilesService.deleteChargingProfile(sessionId, responseUrl);
  }

  @Put('/:sessionId')
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(ChargingProfileResponseSchema, ChargingProfileResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_CHARGING_PROFILE_RESPONSE,
    },
  })
  async updateChargingProfile(
    @Param('sessionId') sessionId: string,
    @BodyWithSchema(SetChargingProfileSchema, SetChargingProfileSchemaName)
    payload: SetChargingProfile,
  ): Promise<ChargingProfileResponse> {
    return this.chargingProfilesService.putChargingProfile(sessionId, payload);
  }
}
