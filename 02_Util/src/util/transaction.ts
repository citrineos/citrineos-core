// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {MeterValue} from "@citrineos/data/lib/layers/sequelize";
import {MeasurandEnumType, ReadingContextEnumType} from "@citrineos/base";

/**
 * Calculate the total Kwh
 *
 * @param {array} meterValues - meterValues of a transaction.
 * @return {number} total Kwh based on the overall values (i.e., without phase) in the simpledValues.
 */
export function getTotalKwh(meterValues: MeterValue[]): number {
    const contexts: ReadingContextEnumType[] = [ReadingContextEnumType.Transaction_Begin, ReadingContextEnumType.Sample_Periodic, ReadingContextEnumType.Transaction_End];

    let valueMap = new Map();
    meterValues.filter(meterValues => meterValues.sampledValue[0].context && contexts.indexOf(meterValues.sampledValue[0].context) !== -1).forEach(
        meterValue => meterValue.sampledValue.filter(simpleValue => simpleValue.phase === undefined && simpleValue.measurand == MeasurandEnumType.Energy_Active_Import_Register).map(simpleValue => {
            let kwhValue: number = 0;
            if (simpleValue.unitOfMeasure?.unit?.toUpperCase() === 'KWH') {
                kwhValue = simpleValue.value;
                valueMap.set(Date.parse(meterValue.timestamp), kwhValue)
            } else if (simpleValue.unitOfMeasure?.unit?.toUpperCase() === 'WH') {
                kwhValue = simpleValue.value / 1000;
                valueMap.set(Date.parse(meterValue.timestamp), kwhValue)
            }
        })
    );

    // sort the map based on timestamps
    valueMap = new Map([...valueMap.entries()].sort((v1, v2) => v1[0] - v2[0]));
    const sortedValues = Array.from(valueMap.values());

    let totalKwh: number = 0;
    for (let i = 1; i < sortedValues.length; i++) {
        totalKwh += sortedValues[i] - sortedValues[i - 1];
    }

    return totalKwh;
}

/**
 * Round floor the given cost to 2 decimal places, e.g., given 1.2378, return 1.23
 *
 * @param {number} cost - cost
 * @return {number} rounded cost
 */
export function roundCost(cost: number): number {
    return Math.floor(cost * 100) / 100
}