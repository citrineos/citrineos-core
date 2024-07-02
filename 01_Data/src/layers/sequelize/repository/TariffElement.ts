// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {SequelizeRepository} from "./Base";
import {ITariffElementRepository} from "../../../interfaces";
import {SystemConfig} from "@citrineos/base";
import {ILogObj, Logger} from "tslog";
import {Sequelize} from "sequelize-typescript";
import {TariffElement} from "../model/Tariff/TariffElement";

export class SequelizeTariffElementRepository extends SequelizeRepository<TariffElement> implements ITariffElementRepository {
    constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
        super(config, TariffElement.MODEL_NAME, logger, sequelizeInstance);
    }
}