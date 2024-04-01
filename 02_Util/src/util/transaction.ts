// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {MeterValue} from "@citrineos/data/lib/layers/sequelize";
import {MeasurandEnumType, ReadingContextEnumType, SampledValueType} from "@citrineos/base";

/**
 * Calculate the total Kwh
 *
 * @param {array} meterValues - meterValues of a transaction.
 * @return {number} total Kwh based on the overall values (i.e., without phase) in the simpledValues.
 */
export function getTotalKwh(meterValues: MeterValue[]): number {
    const contexts: ReadingContextEnumType[] = [ReadingContextEnumType.Transaction_Begin, ReadingContextEnumType.Sample_Periodic, ReadingContextEnumType.Transaction_End];

    let valuesMap = new Map();

    meterValues.filter(meterValue => meterValue.sampledValue[0].context && contexts.indexOf(meterValue.sampledValue[0].context) !== -1).forEach(
        meterValue => {
            const sampledValues = meterValue.sampledValue as SampledValueType[];
            const overallValue = sampledValues.find(sampledValue => sampledValue.phase === undefined && sampledValue.measurand == MeasurandEnumType.Energy_Active_Import_Register);
            if (overallValue && overallValue.unitOfMeasure?.unit?.toUpperCase() === 'KWH') {
                valuesMap.set(Date.parse(meterValue.timestamp), overallValue.value)
            } else if (overallValue && overallValue.unitOfMeasure?.unit?.toUpperCase() === 'WH') {
                valuesMap.set(Date.parse(meterValue.timestamp), overallValue.value / 1000)
            }
        }
    );

    // sort the map based on timestamps
    valuesMap = new Map([...valuesMap.entries()].sort((v1, v2) => v1[0] - v2[0]));
    const sortedValues = Array.from(valuesMap.values());

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