/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { SystemConfig } from "@citrineos/base";
import { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { ILogObj, Logger } from "tslog";
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from "./model/Authorization";
import { Boot } from "./model/Boot";
import { Component, Evse, Variable, VariableAttribute, VariableCharacteristics, VariableStatus } from "./model/DeviceModel";
import { MeterValue, Transaction, TransactionEvent } from "./model/TransactionEvent";

export class DefaultSequelizeInstance {

    /**
     * Fields
     */
    private static instance: Sequelize | null = null;

    private constructor() { }

    public static getInstance(config: SystemConfig, logger?: Logger<ILogObj>): Sequelize {
        if (!DefaultSequelizeInstance.instance) {
            DefaultSequelizeInstance.instance = this.defaultSequelize(config, logger);
        }
        return DefaultSequelizeInstance.instance;
    }

    private static defaultSequelize(config: SystemConfig, logger?: Logger<ILogObj>) {

        const sequelizeLogger = logger ? logger.getSubLogger({ name: this.name }) : new Logger<ILogObj>({ name: this.name });

        sequelizeLogger.info("Creating default Sequelize instance");

        const sequelize: Sequelize = new Sequelize({
            host: config.data.sequelize.host,
            port: config.data.sequelize.port,
            database: config.data.sequelize.database,
            dialect: config.data.sequelize.dialect as Dialect,
            username: config.data.sequelize.username,
            password: config.data.sequelize.password,
            storage: config.data.sequelize.storage,
            models: [AdditionalInfo, Authorization, Boot,
                Component, Evse, IdToken, IdTokenInfo, MeterValue, Transaction,
                TransactionEvent, VariableAttribute, VariableCharacteristics,
                VariableStatus, Variable],
            logging: (sql: string, timing?: number) => {
                // TODO: Look into fixing that
                // sequelizeLogger.debug(timing, sql);
            }
        });

        if (config.data.sequelize.sync) {
            sequelize.sync({ force: true }).then(() => {
                sequelizeLogger.info("Database synchronized");
            });
        }

        return sequelize;
    }
}

