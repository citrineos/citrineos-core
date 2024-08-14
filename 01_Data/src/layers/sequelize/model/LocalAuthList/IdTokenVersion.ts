// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import {Column, DataType, ForeignKey, HasMany, Model, Table} from 'sequelize-typescript';
import {IdToken} from "../Authorization";
import {LocalAuthListVersion} from "./LocalAuthListVersion";

/**
 * Represents a stored version of the id token for a charging station.
 *
 */
@Table
export class IdTokenVersion extends Model {
    static readonly MODEL_NAME: string = Namespace.LocalAuthListIdToken;

    @ForeignKey(() => IdToken)
    @Column(DataType.INTEGER)
    declare idTokenId: number;

    @ForeignKey(() => LocalAuthListVersion)
    @Column(DataType.INTEGER)
    declare versionDatabaseId: number;
}
