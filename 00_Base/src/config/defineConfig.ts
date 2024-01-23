// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type SystemConfig, systemConfigSchema, SystemConfigInput } from "./types";

export function defineConfig(inputConfig: SystemConfigInput): SystemConfig {
    if (!inputConfig.data.sequelize.username) {
        if (process.env.CITRINEOS_DB_USERNAME)
            inputConfig.data.sequelize.username = process.env.CITRINEOS_DB_USERNAME;
        else
            throw new Error('CITRINEOS_DB_USERNAME must be set if username not provided in config');
    }
    if (!inputConfig.data.sequelize.password) {
        if (process.env.CITRINEOS_DB_PASSWORD)
            inputConfig.data.sequelize.password = process.env.CITRINEOS_DB_PASSWORD;
        else
            throw new Error('CITRINEOS_DB_PASSWORD must be set if password not provided in config');
    }
    return systemConfigSchema.parse(inputConfig);
}