// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import type { AbstractHandler } from '@citrineos/base';
import { InstallCertificateHelperService } from './module/installCertificateHelperService.js';
import { GetCertificateStatusRequestHandler } from '@/handlers/requests/GetCertificateStatusRequestHandler.js';

/**
 * Registers the Certificates module's internal services as scoped dependencies.
 */
export function registerCertificatesServices(container: AwilixContainer): void {
  container.register({
    installCertificateHelperService: asClass(InstallCertificateHelperService).scoped(),
    getCertificateStatusRequestHandler: asClass(GetCertificateStatusRequestHandler).scoped(),
    certificatesHandlers: asFunction(
      ({ getCertificateStatusRequestHandler }): AbstractHandler[] => [
        getCertificateStatusRequestHandler,
      ],
    ).scoped(),
  });
}
