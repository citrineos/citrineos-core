// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  GetTenantByIdQueryResult,
  GetTenantByIdQueryVariables,
} from '../transport/graphql/index.js';
import { GET_TENANT_BY_ID } from '../transport/graphql/index.js';
import type { IOcpiGraphqlClient } from '../transport/graphql/index.js';
import type { OcpiGraphqlDependencies } from '../server/dependencies.js';
import { VersionNumber } from '../types/version-number.js';
import { NotFoundError } from 'routing-controllers';
import type { VersionDetailsResponseDTO } from '../types/dto/version-details-response-dto.js';
import type { VersionListResponseDTO } from '../types/dto/version-list-response-dto.js';
import { OcpiResponseStatusCode } from '../types/ocpi-response.js';
import type { Endpoint, TenantDto, Version } from '@citrineos/types';
import { RegistrationMapper } from '../mappers/index.js';

export class VersionService {
  private readonly ocpiGraphqlClient: IOcpiGraphqlClient;

  constructor({ ocpiGraphqlClient }: OcpiGraphqlDependencies) {
    this.ocpiGraphqlClient = ocpiGraphqlClient;
  }

  async getVersions(tenantId: number): Promise<VersionListResponseDTO> {
    const response = await this.ocpiGraphqlClient.request<
      GetTenantByIdQueryResult,
      GetTenantByIdQueryVariables
    >(GET_TENANT_BY_ID, { id: tenantId });
    const tenant = response.Tenants[0] as TenantDto;
    const versions: Version[] = Array.from(tenant.serverProfileOCPI?.versionDetails || []);
    return {
      data: versions.map((version: Version) => ({
        version: RegistrationMapper.toVersionNumber(version.version),
        url: version.versionDetailsUrl!,
      })),
      status_code: OcpiResponseStatusCode.GenericSuccessCode,
      timestamp: new Date(),
    };
  }

  async getVersionDetails(
    tenantId: number,
    version: VersionNumber,
  ): Promise<VersionDetailsResponseDTO> {
    const response = await this.ocpiGraphqlClient.request<
      GetTenantByIdQueryResult,
      GetTenantByIdQueryVariables
    >(GET_TENANT_BY_ID, { id: tenantId });
    const tenant = response.Tenants[0] as TenantDto;
    const tenantVersionEndpoints: Endpoint[] | undefined =
      tenant.serverProfileOCPI?.versionEndpoints &&
      tenant.serverProfileOCPI.versionEndpoints[RegistrationMapper.toOCPIVersionNumber(version)];
    if (!tenantVersionEndpoints) {
      throw new NotFoundError('Version not found');
    }
    return {
      data: {
        version: version,
        endpoints:
          tenantVersionEndpoints.map((value: Endpoint) => {
            const { identifier, role } = RegistrationMapper.toModuleAndRole(value);
            return {
              identifier,
              role,
              url: value.url,
            };
          }) || [],
      },
      status_code: OcpiResponseStatusCode.GenericSuccessCode,
      timestamp: new Date(),
    };
  }
}
