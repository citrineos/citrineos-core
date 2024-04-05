// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, CustomDataType, VariableMonitoringType, MonitorEnumType, VariableType, ComponentType } from "@citrineos/base";
import { Table, Model, AutoIncrement, Column, DataType, PrimaryKey, Index, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Variable, Component } from "../DeviceModel";

@Table
export class VariableMonitoring extends Model implements VariableMonitoringType {

    static readonly MODEL_NAME: string = Namespace.VariableMonitoringType;

    declare customData?: CustomDataType;

    /**
     * Fields
     */

    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare databaseId: number;

    @Index
    @Column({
        unique: 'stationId_Id'
    })
    declare stationId: string;

    @Column({
        type: DataType.INTEGER,
        unique: 'stationId_Id'
    })
    declare id: number;

    @Column(DataType.BOOLEAN)
    declare transaction: boolean;

    @Column(DataType.INTEGER)
    declare value: number;

    @Column(DataType.STRING)
    declare type: MonitorEnumType;

    @Column(DataType.INTEGER)
    declare severity: number;

    /**
     * Relations
     */

    @BelongsTo(() => Variable)
    declare variable: VariableType;

    @ForeignKey(() => Variable)
    @Column({
        type: DataType.INTEGER,
    })
    declare variableId?: number;

    @BelongsTo(() => Component)
    declare component: ComponentType;

    @ForeignKey(() => Component)
    @Column({
        type: DataType.INTEGER,
    })
    declare componentId?: number;
}