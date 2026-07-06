// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { GetTenantByIdQueryResult, GetTenantByIdQueryVariables } from '../graphql/index.js';
import { GET_TENANT_BY_ID, OcpiGraphqlClient } from '../graphql/index.js';
import { VersionNumber } from '../model/VersionNumber.js';
import { Service } from 'typedi';
import { NotFoundError } from 'routing-controllers';
import type { VersionDetailsResponseDTO } from '../model/DTO/VersionDetailsResponseDTO.js';
import type { VersionListResponseDTO } from '../model/DTO/VersionListResponseDTO.js';
import { OcpiResponseStatusCode } from '../model/OcpiResponse.js';
import type { Endpoint, TenantDto, Version } from '@citrineos/base';
import { RegistrationMapper } from '../mapper/index.js';

@Service()
export class VersionService {
  constructor(private ocpiGraphqlClient: OcpiGraphqlClient) {}

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
