// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { BootConfig, RegistrationStatusEnumType, StatusInfoType } from "@citrineos/base";
import { IBootRepository } from "../../../interfaces/repositories";
import { SequelizeRepository } from "./Base";
import { Boot } from "../model/Boot";
import { VariableAttribute } from "../model/DeviceModel";
import { Op } from "sequelize";

export class BootRepository extends SequelizeRepository<Boot> implements IBootRepository {

    async createOrUpdateByKey(value: BootConfig, key: string): Promise<Boot | undefined> {
        return this.existsByKey(key).then(exists => {
            if (exists) {
                return super.updateByKey(Boot.build({
                    id: key,
                    ...value
                }), key, Boot.MODEL_NAME);
            } else {
                return super.create(Boot.build({
                    id: key,
                    ...value
                }));
            }
        }).then(async savedBootConfig => {
            if (savedBootConfig) {
                if (value.pendingBootSetVariableIds) {
                    savedBootConfig.pendingBootSetVariables = await this.manageSetVariables(value.pendingBootSetVariableIds, key, savedBootConfig.id);
                }
            }
            return savedBootConfig;
        });
    }

    updateStatusByKey(status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string): Promise<Boot | undefined> {
        return this.readByKey(key).then(boot => {
            if (boot) {
                boot.status = status;
                boot.statusInfo = statusInfo
                return boot.save();
            }
        });
    }

    updateLastBootTimeByKey(lastBootTime: string, key: string): Promise<Boot | undefined> {
        return this.readByKey(key).then(boot => {
            if (boot) {
                boot.lastBootTime = lastBootTime;
                return boot.save();
            }
        });
    }

    readByKey(key: string): Promise<Boot> {
        return super.readByKey(key, Boot.MODEL_NAME);
    }

    existsByKey(key: string): Promise<boolean> {
        return super.existsByKey(key, Boot.MODEL_NAME);
    }

    deleteByKey(key: string): Promise<boolean> {
        return super.deleteByKey(key, Boot.MODEL_NAME);
    }

    /**
     * Private Methods
     */

    private async manageSetVariables(setVariableIds: number[], stationId: string, bootConfigId: string): Promise<VariableAttribute[]> {
        const managedSetVariables: VariableAttribute[] = [];
        const savedSetVariables: VariableAttribute[] = await this.s.models[VariableAttribute.MODEL_NAME].findAll({
            where: {
                stationId: stationId, bootConfigId: { [Op.ne]: null }
            }
        }).then(rows => rows as VariableAttribute[]);
        // Unassign variables not in array, remove already assigned variables from array
        for (const setVariable of savedSetVariables) {
            const setVariableIndex: number = setVariableIds.indexOf(setVariable.id);
            if (setVariableIndex < 0) {
                setVariable.bootConfigId = undefined;
                setVariable.save();
            } else {
                managedSetVariables.push(setVariable);
                setVariableIds.splice(setVariableIndex, 1);
            }
        }
        // Assigns previously unassigned variables, or throws an error if variable with id does not exist
        for (const setVariableId of setVariableIds) {
            const setVariable: VariableAttribute = await this.s.models[VariableAttribute.MODEL_NAME]
                .findOne({ where: { id: setVariableId } }).then(row => row as VariableAttribute);
            if (!setVariable) {
                throw new Error("SetVariableId does not exist " + setVariableId);
            } else {
                setVariable.bootConfigId = bootConfigId;
                managedSetVariables.push(await setVariable.save());
            }
        }
        return managedSetVariables;
    }
}