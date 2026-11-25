// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { VersionDetailsResponseDTO, VersionListResponseDTO } from '../../../../index.js';
import {
  AsOcpiRegistrationEndpoint,
  BaseController,
  ModuleId,
  ResponseSchema,
  VersionDetailsResponseDTOSchema,
  VersionDetailsResponseDTOSchemaName,
  versionIdParam,
  VersionListResponseDTOSchema,
  VersionListResponseDTOSchemaName,
  VersionNumber,
  VersionNumberParam,
  VersionService,
  WrongClientAccessException,
} from '../../../../index.js';
import { HttpStatus } from '@citrineos/base';
import type { IVersionsModuleApi } from './i-versions-module-api.js';
import { Ctx, Get, JsonController, Param } from 'routing-controllers';
import type { OcpiDependencies } from '../../../server/dependencies.js';

export interface VersionsModuleApiDependencies extends OcpiDependencies {
  versionService: VersionService;
}

@JsonController(`/${ModuleId.Versions}`)
export class VersionsModuleApi extends BaseController implements IVersionsModuleApi {
  readonly versionService: VersionService;

  constructor(dependencies: VersionsModuleApiDependencies) {
    super(dependencies);
    this.versionService = dependencies.versionService;
  }

  @Get('/:tenant_id')
  @AsOcpiRegistrationEndpoint()
  @ResponseSchema(VersionListResponseDTOSchema, VersionListResponseDTOSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    // examples: {}, // todo real example
  })
  async getVersions(
    @Param('tenant_id') tenantId: number,
    @Ctx() ctx?: { state?: { tenantPartner?: { tenantId?: number } } },
  ): Promise<VersionListResponseDTO> {
    this._assertTenantAccess(tenantId, ctx);
    return this.versionService.getVersions(tenantId);
  }

  @Get(`/:tenant_id/:${versionIdParam}`)
  @AsOcpiRegistrationEndpoint()
  @ResponseSchema(VersionDetailsResponseDTOSchema, VersionDetailsResponseDTOSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    // examples: {}, // todo real example
  })
  async getVersionDetails(
    @Param('tenant_id') tenantId: number,
    @VersionNumberParam() versionNumber: VersionNumber,
    @Ctx() ctx?: { state?: { tenantPartner?: { tenantId?: number } } },
  ): Promise<VersionDetailsResponseDTO> {
    this._assertTenantAccess(tenantId, ctx);
    return this.versionService.getVersionDetails(tenantId, versionNumber);
  }

  private _assertTenantAccess(
    tenantId: number,
    ctx?: { state?: { tenantPartner?: { tenantId?: number } } },
  ): void {
    if (ctx && Number(tenantId) !== ctx.state?.tenantPartner?.tenantId) {
      throw new WrongClientAccessException(`Client is not authorized to access tenant ${tenantId}`);
    }
  }
}
