// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICache, AttributeEnumType, SetVariableStatusEnumType } from "@citrineos/base";
import { DeviceModelRepository } from "@citrineos/data/lib/layers/sequelize";
import { Logger, ILogObj } from "tslog";
import * as bcrypt from "bcrypt";

export interface IAuthenticator {
    authenticate(identifier: string, username?: string, password?: string): Promise<boolean>;
}

export class Authenticator implements IAuthenticator {

    protected _cache: ICache;
    protected _logger: Logger<ILogObj>;
    private _deviceModelRepository: DeviceModelRepository;

    constructor(
        cache: ICache,
        logger: Logger<ILogObj>,
        deviceModelRepository: DeviceModelRepository) {
        this._cache = cache;
        this._logger = logger;
        this._deviceModelRepository = deviceModelRepository;
    }

    async authenticate(identifier: string, username?: string, password?: string): Promise<boolean> {

        if (username && password) {
            if (username != identifier || await this._checkPassword(username, password) === false) {
                this._logger.warn("Unauthorized", identifier);
                return false;
            }
        }
        return true;
    }

    private async _checkPassword(username: string, password: string) {
        return (await this._deviceModelRepository.readAllByQuery({
            stationId: username,
            component_name: 'SecurityCtrlr',
            variable_name: 'BasicAuthPassword',
            type: AttributeEnumType.Actual
        }).then(r => {
            if (r && r[0]) {
                // Grabbing value most recently *successfully* set on charger
                const hashedPassword = r[0].statuses?.filter(status => status.status !== SetVariableStatusEnumType.Rejected).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).shift();
                if (hashedPassword?.value) {
                    return bcrypt.compare(password, hashedPassword.value);
                }
            }
            this._logger.warn("Has no password", username);
            return false;
        }));
    }
}