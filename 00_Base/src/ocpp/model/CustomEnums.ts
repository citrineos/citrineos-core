// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Types of sequence in a Charging Station
 */
export enum ChargingStationSequenceType {
    customerInformation = 'customerInformation',
    getBaseReport = 'getBaseReport',
    getChargingProfiles = 'getChargingProfiles',
    getDisplayMessages = 'getDisplayMessages',
    getLog = 'getLog',
    getMonitoringReport = 'getMonitoringReport',
    getReport = 'getReport',
    publishFirmware = 'publishFirmware',
    remoteStartId = 'remoteStartId',
    updateFirmware = 'updateFirmware',
    transactionId = 'transactionId',
}

/**
 * Types of events that is associated with a transaction
 */
export enum TransactionEventType {
    transactionEvent = 'transactionEvent',
    startTransaction = 'startTransaction',
    stopTransaction = 'stopTransaction',
    meterValue = 'meterValue',
}