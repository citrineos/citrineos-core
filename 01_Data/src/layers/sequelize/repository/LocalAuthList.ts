// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, SendLocalListRequest, SystemConfig, UpdateEnumType } from "@citrineos/base";
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from "tslog";
import { ILocalAuthListRepository } from "../../../interfaces";
import { Authorization, IdToken } from "../model/Authorization";
import { LocalListVersion } from "../model/Authorization/LocalListVersion";
import { SendLocalList } from "../model/Authorization/SendLocalList";
import { SequelizeRepository } from "./Base";
import { LocalListVersionAuthorization } from "../model/Authorization/LocalListVersionAuthorization";
import { LocalListAuthorization } from "../model/Authorization/LocalListAuthorization";

import { v4 as uuidv4 } from 'uuid';
import { SendLocalListAuthorization } from "../model/Authorization/SendLocalListAuthorization";

export class SequelizeLocalAuthListRepository extends SequelizeRepository<LocalListVersion> implements ILocalAuthListRepository {
    localListAuthorization: CrudRepository<LocalListAuthorization>;
    sendLocalList: CrudRepository<SendLocalList>;

    constructor(
        config: SystemConfig,
        logger?: Logger<ILogObj>,
        sequelizeInstance?: Sequelize,
        authorization?: CrudRepository<LocalListAuthorization>,
        sendLocalList?: CrudRepository<SendLocalList>,
    ) {
        super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
        this.localListAuthorization = authorization ? authorization : new SequelizeRepository<LocalListAuthorization>(config, LocalListAuthorization.MODEL_NAME, logger, sequelizeInstance);
        this.sendLocalList = sendLocalList ? sendLocalList : new SequelizeRepository<SendLocalList>(config, SendLocalList.MODEL_NAME, logger, sequelizeInstance);
    }

    async createSendLocalList(stationId: string, versionNumber: number, updateType: UpdateEnumType, localAuthorizationList?: [Authorization, ...Authorization[]]): Promise<SendLocalList> {
        const sendLocalList = await SendLocalList.create({
            stationId,
            correlationId: uuidv4(),
            versionNumber,
            updateType,
        });
        localAuthorizationList?.map(async (auth) => {
            const { id, ...authorizationFields } = auth;
            const localListAuthorization = await this.localListAuthorization.create(LocalListAuthorization.build({
                ...authorizationFields,
                authorizationId: id,
            }));
            await SendLocalListAuthorization.create({
                sendLocalListId: sendLocalList.id,
                authorizationId: localListAuthorization.id
            });
        });
        await sendLocalList.reload({ include: [LocalListAuthorization] });

        this.sendLocalList.emit('created', [sendLocalList]);

        return sendLocalList;
    }

    async validateOrReplaceLocalListVersionForStation(versionNumber: number, stationId: string): Promise<void> {
        await this.s.transaction(async (transaction) => {
            const localListVersion = await LocalListVersion.findOne({ where: { stationId }, transaction });
            if (localListVersion && localListVersion.versionNumber === versionNumber) {
                return;
            }
            if (localListVersion && localListVersion.versionNumber !== versionNumber) {
                // Remove associations
                await LocalListVersionAuthorization.destroy({ where: { localListVersionId: localListVersion.id }, transaction });
                // Destroy old version
                await LocalListVersion.destroy({ where: { stationId }, transaction });
            }

            await LocalListVersion.create({ stationId, versionNumber }, { transaction });
        });
    }

    async getNextVersionNumberForStation(stationId: string): Promise<number> {
        const localListVersion = await this.readOnlyOneByQuery({ where: { stationId } });
        return localListVersion ? localListVersion.versionNumber + 1 : 1;
    }

    async getSendLocalListRequestByStationIdAndCorrelationId(stationId: string, correlationId: string): Promise<SendLocalList | undefined> {
        return this.sendLocalList.readOnlyOneByQuery({ where: { stationId, correlationId } });
    }

    async createOrUpdateLocalListVersionFromStationIdAndSendLocalList(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion> {
        switch (sendLocalList.updateType) {
            case UpdateEnumType.Full:
                return this.replaceLocalListVersionFromStationIdAndSendLocalList(stationId, sendLocalList);
            case UpdateEnumType.Differential:
                return this.updateLocalListVersionFromStationIdAndSendLocalListRequest(stationId, sendLocalList);
        }
    }

    async replaceLocalListVersionFromStationIdAndSendLocalList(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion> {
        const localListVersion = await this.s.transaction(async (transaction) => {
            const oldLocalListVersion = await LocalListVersion.findOne({ where: { stationId }, include: [LocalListAuthorization], transaction });
            if (oldLocalListVersion) {
                // Remove associations
                await LocalListVersionAuthorization.destroy({ where: { localListVersionId: oldLocalListVersion.id }, transaction });
                // Destroy old version
                await LocalListVersion.destroy({ where: { stationId }, transaction });
            }

            const localListVersion = await LocalListVersion.create({
                stationId,
                versionNumber: sendLocalList.versionNumber
            }, { transaction });

            if (!sendLocalList.localAuthorizationList) {
                return localListVersion;
            }

            for (const auth of sendLocalList.localAuthorizationList) {
                await LocalListVersionAuthorization.create({
                    localListVersionId: localListVersion.id,
                    authorizationId: auth.id
                }, { transaction });
            }

            return localListVersion.reload({ include: [LocalListAuthorization], transaction });
        });

        this.emit('created', [localListVersion]);

        return localListVersion;
    }

    async updateLocalListVersionFromStationIdAndSendLocalListRequest(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion> {
        const localListVersion = await this.s.transaction(async (transaction) => {
            if (!sendLocalList.localAuthorizationList) {
                // See D01.FR.05
                const localListVersion = await this._updateAllByQuery({ versionNumber: sendLocalList.versionNumber }, { where: { stationId }, transaction });
                if (localListVersion.length !== 1) {
                    throw new Error(`LocalListVersion not found for ${stationId} during differential version update: ${JSON.stringify(localListVersion)}`);
                } else {
                    return localListVersion[0];
                }
            }

            const localListVersion = await LocalListVersion.findOne({ where: { stationId }, include: [LocalListAuthorization], transaction });

            if (!localListVersion) {
                throw new Error(`LocalListVersion not found for ${stationId} during differential update`);
            }

            for (const auth of sendLocalList.localAuthorizationList) {
                await LocalListVersionAuthorization.create({
                    localListVersionId: localListVersion.id,
                    authorizationId: auth.id
                }, { transaction });
            }

            return localListVersion.reload({ include: [LocalListAuthorization], transaction });
        });

        this.emit('updated', [localListVersion]);

        return localListVersion;
    }
}