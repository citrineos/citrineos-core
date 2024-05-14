// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from '@citrineos/data';
import { UnauthorizedException } from '@citrineos/base';
import { Credentials } from '../../../model/Credentials';
import { OcpiNamespace } from '../../../util/ocpi.namespace';

export class CredentialsRepository extends SequelizeRepository<Credentials> {
  public async authorizeToken(token: string): Promise<boolean> {
    const exists = await this.credentialsExistForGivenToken(token);
    if (!exists) {
      return new Promise((resolve, reject) => {
        reject(
          new UnauthorizedException('Credentials not found for given token'),
        );
      });
    } else {
      return new Promise((resolve) => {
        resolve(true);
      });
    }
  }

  private credentialsExistForGivenToken = async (
    token: string,
  ): Promise<boolean> => {
    try {
      const exists = await this.existsByKey(token, OcpiNamespace.Credentials);
      return Promise.resolve(exists);
    } catch (e) {
      return Promise.resolve(false);
    }
  };
}
