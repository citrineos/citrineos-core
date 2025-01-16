// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Model } from 'sequelize-typescript';

export abstract class AbstractMapper {
  abstract toModel(): Model;
}
