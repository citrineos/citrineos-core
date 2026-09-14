// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VersionDetailsResponseDTO, VersionListResponseDTO } from '../../../index.js';
import { VersionNumber } from '../../../index.js';

/**
 * Interface for the Versions module API.
 * Defines the contract for OCPI version management endpoints.
 */
export interface IVersionsModuleApi {
  /**
   * Get list of supported OCPI versions
   * @returns Promise resolving to version list response
   */
  getVersions(tenantId: number): Promise<VersionListResponseDTO>;

  /**
   * Get details for a specific OCPI version
   * @param versionNumber - The version number to get details for
   * @returns Promise resolving to version details response
   */
  getVersionDetails(
    tenantId: number,
    versionNumber: VersionNumber,
  ): Promise<VersionDetailsResponseDTO>;
}
