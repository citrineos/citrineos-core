// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  type BootstrapConfig,
  getHandlersByConfig,
  type SystemConfig,
} from '@citrineos/base';
import { InstallCertificateHelperService } from './module/installCertificateHelperService.js';

/**
 * Registers the Certificates module's internal services as scoped dependencies.
 */
export function registerCertificatesServices(container: AwilixContainer): void {
  container.register({
    installCertificateHelperService: asClass(InstallCertificateHelperService).scoped(),
    certificatesHandlers: asFunction(
      (
        cradle: { config: BootstrapConfig & SystemConfig } & Record<string, unknown>,
      ): AbstractHandler[] =>
        getHandlersByConfig(
          cradle,
          cradle.config.modules.certificates?.requests ?? [],
          cradle.config.modules.certificates?.responses ?? [],
        ),
    ).scoped(),
  });
}
