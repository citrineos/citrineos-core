// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AuthenticationOptions } from '@citrineos/base';
import type { ChargingStationDto } from '@citrineos/types';
import { IncomingMessage } from 'http';
import type { TLSSocket } from 'tls';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { AuthenticatorFilter } from './authenticator-filter.js';
import { UpgradeAuthenticationError } from './errors/authentication-error.js';

interface IStationSerialNumberLookup {
  readChargingStationByOcppConnectionName(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStationDto | undefined>;
}

export class ClientCertificateFilter extends AuthenticatorFilter {
  private _chargingStationRepository: IStationSerialNumberLookup;

  constructor({
    chargingStationRepository,
    logger,
  }: {
    chargingStationRepository: IStationSerialNumberLookup;
    logger: Logger<ILogObj>;
  }) {
    super(logger);
    this._chargingStationRepository = chargingStationRepository;
  }

  protected shouldFilter(options: AuthenticationOptions): boolean {
    return options.securityProfile === 3;
  }

  protected async filter(
    tenantId: number,
    identifier: string,
    request: IncomingMessage,
  ): Promise<void> {
    const socket = request.socket as TLSSocket;
    const certificate =
      typeof socket.getPeerCertificate === 'function' && socket.authorized
        ? socket.getPeerCertificate()
        : undefined;
    if (!certificate || Object.keys(certificate).length === 0) {
      throw new UpgradeAuthenticationError(
        `Client certificate missing or not authorised for ${identifier}`,
      );
    }

    const commonName = certificate.subject?.CN;
    const chargingStation =
      await this._chargingStationRepository.readChargingStationByOcppConnectionName(
        tenantId,
        identifier,
      );
    const expected = chargingStation?.chargePointSerialNumber || identifier;
    if (commonName !== expected) {
      throw new UpgradeAuthenticationError(
        `Certificate CN ${commonName} does not match ${identifier} (expected ${expected})`,
      );
    }
  }
}

export default ClientCertificateFilter;
