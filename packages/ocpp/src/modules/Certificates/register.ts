// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  buildHandlers,
  type HandlerClass,
  type HandlerResolverCradle,
} from '@citrineos/base';
import {
  CertificateSignedResponseOcpp2Handler,
  DeleteCertificateResponseOcpp2Handler,
  Get15118EVCertificateRequestOcpp2Handler,
  GetCertificateStatusRequestOcpp2Handler,
  GetInstalledCertificateIdsResponseOcpp2Handler,
  InstallCertificateResponseOcpp2Handler,
  SignCertificateRequestOcpp2Handler,
} from '@handlers/index.js';

/**
 * The handlers this module owns. Which of them are built is decided by the module's configured
 * requests/responses; the actions each one serves are declared on the handler class itself.
 */
const CERTIFICATES_HANDLERS = [
  Get15118EVCertificateRequestOcpp2Handler,
  GetCertificateStatusRequestOcpp2Handler,
  SignCertificateRequestOcpp2Handler,
  CertificateSignedResponseOcpp2Handler,
  DeleteCertificateResponseOcpp2Handler,
  GetInstalledCertificateIdsResponseOcpp2Handler,
  InstallCertificateResponseOcpp2Handler,
] satisfies ReadonlyArray<HandlerClass>;

/**
 * Registers the Certificates module's internal services as scoped dependencies.
 */
export function registerCertificatesServices(container: AwilixContainer): void {
  container.register({
    certificatesHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, CERTIFICATES_HANDLERS),
    ).scoped(),
  });
}
