// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { childLogger, type IFileStorage, type IRoleProvider } from '@citrineos/base';
import { type RoleDefinitions, RoleDefinitionsSchema, type SystemConfig } from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';

interface SeedFileRoleProviderDependencies {
  config: SystemConfig;
  fileStorage: IFileStorage;
  logger?: Logger<ILogObj>;
}

export class SeedFileRoleProvider implements IRoleProvider {
  private readonly _seedFile: string;
  private readonly _fileStorage: IFileStorage;
  private readonly _logger: Logger<ILogObj>;

  constructor({ config, fileStorage, logger }: SeedFileRoleProviderDependencies) {
    this._seedFile = config.roles.seedFile;
    this._fileStorage = fileStorage;
    this._logger = childLogger(logger, this.constructor.name);
  }

  async listRoles(): Promise<RoleDefinitions> {
    const contents = await this._fileStorage.getFile(this._seedFile, undefined, { trusted: true });
    if (contents === undefined) {
      throw new Error(`Role seed file not found: ${this._seedFile}`);
    }

    const parsed = RoleDefinitionsSchema.safeParse(JSON.parse(contents));
    if (!parsed.success) {
      throw new Error(`Invalid role seed file ${this._seedFile}: ${parsed.error.message}`);
    }

    this._logger.debug(`Loaded ${Object.keys(parsed.data).length} roles from ${this._seedFile}`);
    return parsed.data;
  }
}
