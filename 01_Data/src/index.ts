// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import 'reflect-metadata'
export * as sequelize from './layers/sequelize'
export * from './interfaces'
export { Boot, Component, Variable, VariableAttribute } from './layers/sequelize' // todo export better as these seem to be used in other modules

// Sequelize Repositories
export { SequelizeRepository } from './layers/sequelize/repository/Base'
export { AuthorizationRepository } from './layers/sequelize/repository/Authorization'
export { BootRepository } from './layers/sequelize/repository/Boot'
export { DeviceModelRepository } from './layers/sequelize/repository/DeviceModel'
export { LocationRepository } from './layers/sequelize/repository/Location'
export { TransactionEventRepository } from './layers/sequelize/repository/TransactionEvent'
export { SecurityEventRepository } from './layers/sequelize/repository/SecurityEvent'
export { VariableMonitoringRepository } from './layers/sequelize/repository/VariableMonitoring'
