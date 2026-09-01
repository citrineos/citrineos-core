// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Component } from '../../models/DeviceModel/Component.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

// Components are read through the inherited CrudRepository methods only — the
// class exists so the namespace binding lives with the repository rather than at
// every construction site, and so it can be registered with awilix `asClass`.
export class SequelizeComponentRepository extends SequelizeRepository<Component> {
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Component.MODEL_NAME, logger, sequelizeInstance });
  }
}

export default SequelizeComponentRepository;
