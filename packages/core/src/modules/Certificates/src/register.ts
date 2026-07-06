// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, type AwilixContainer } from 'awilix';
import { InstallCertificateHelperService } from './module/installCertificateHelperService.js';

/**
 * Registers the Certificates module's internal services as scoped dependencies.
 */
export function registerCertificatesServices(container: AwilixContainer): void {
  container.register({
    installCertificateHelperService: asClass(InstallCertificateHelperService).scoped(),
  });
}
