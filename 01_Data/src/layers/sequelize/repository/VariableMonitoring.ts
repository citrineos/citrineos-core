// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {SequelizeRepository} from "./Base";
import {EventData, VariableMonitoring, VariableMonitoringStatus} from "../model/VariableMonitoring";
import {IVariableMonitoringRepository} from "../../../interfaces";
import {
    CallAction,
    EventDataType,
    MonitoringDataType,
    SetMonitoringDataType,
    SetMonitoringResultType,
    SetMonitoringStatusEnumType
} from "@citrineos/base";
import {Component, Variable} from "../model/DeviceModel";

export class VariableMonitoringRepository extends SequelizeRepository<VariableMonitoring> implements IVariableMonitoringRepository {

    async createOrUpdateByMonitoringDataTypeAndStationId(value: MonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring[]> {
        return await Promise.all(value.variableMonitoring.map(async variableMonitoring => {
            const [savedVariableMonitoring, variableMonitoringCreated] = await VariableMonitoring.upsert({
                stationId: stationId,
                variableId: variableId,
                componentId: componentId,
                id: variableMonitoring.id,
                transaction: variableMonitoring.transaction,
                value: variableMonitoring.value,
                type: variableMonitoring.type,
                severity: variableMonitoring.severity
            })

            await this.createVariableMonitoringStatus(SetMonitoringStatusEnumType.Accepted, CallAction.NotifyMonitoringReport, savedVariableMonitoring.get('databaseId') as number);

            return savedVariableMonitoring;
        }))
    }

    async createVariableMonitoringStatus(status: SetMonitoringStatusEnumType, action: CallAction, variableMonitoringId: number): Promise<void> {
        await VariableMonitoringStatus.create({
            status: status,
            statusInfo: {reasonCode: action},
            variableMonitoringId: variableMonitoringId
        });
    }

    async createOrUpdateBySetMonitoringDataTypeAndStationId(value: SetMonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring> {
        const [savedVariableMonitoring, variableMonitoringCreated] = await VariableMonitoring.upsert({
            stationId: stationId,
            variableId: variableId,
            componentId: componentId,
            id: value.id,
            transaction: value.transaction,
            value: value.value,
            type: value.type,
            severity: value.severity
        })
        return savedVariableMonitoring;
    }

    async rejectAllVariableMonitoringsByStationId(action: CallAction, stationId: string): Promise<void> {
        await VariableMonitoring.findAll({
            where: {
                stationId: stationId
            }
        }).then(async variableMonitorings => {
            for (const variableMonitoring of variableMonitorings) {
                await this.createVariableMonitoringStatus(SetMonitoringStatusEnumType.Rejected, action, variableMonitoring.databaseId);
            }
        })
    }

    async rejectVariableMonitoringByIdAndStationId(action: CallAction, id: number, stationId: string): Promise<void> {
        // use findAll since according to the OCPP 2.0.1 installed VariableMonitors should have unique id’s
        // but the id’s of removed Installed monitors should have unique id’s
        // but the id’s of removed monitors MAY be reused.
        await VariableMonitoring.findAll(
            {
                where: {
                    id: id,
                    stationId: stationId
                }
            }
        ).then(async variableMonitorings => {
            for (const variableMonitoring of variableMonitorings) {
                await this.createVariableMonitoringStatus(SetMonitoringStatusEnumType.Rejected, action, variableMonitoring.databaseId);
            }
        })
    }

    async updateResultByStationId(result: SetMonitoringResultType, stationId: string): Promise<VariableMonitoring | undefined> {
        const savedVariableMonitoring = await super.readByQuery({
            where: {stationId: stationId, type: result.type, severity: result.severity},
            include: [{model: Component,
                where: {
                    name: result.component.name,
                    instance: result.component.instance ? result.component.instance : null
                }
            },
                {model: Variable,
                    where: {
                        name: result.variable.name,
                        instance: result.variable.instance ? result.variable.instance : null
                    }
                }]
        }, VariableMonitoring.MODEL_NAME);

        if (savedVariableMonitoring) {
            // The Id is only returned from Charging Station when status is accepted.
            if (result.status === SetMonitoringStatusEnumType.Accepted) {
                await savedVariableMonitoring.update({
                    id: result.id,
                })
            }

            await VariableMonitoringStatus.create({
                status: result.status,
                statusInfo: result.statusInfo,
                variableMonitoringId: savedVariableMonitoring.get('databaseId')
            });
            // Reload in order to include the statuses
            return savedVariableMonitoring.reload({
                include: [VariableMonitoringStatus]
            });
        } else {
            throw new Error(`Unable to update set monitoring result: ${result}`);
        }
    }

    async createEventDatumByComponentIdAndVariableIdAndStationId(event: EventDataType, componentId: string, variableId: string, stationId: string): Promise<EventData> {
        return await EventData.create({
            stationId: stationId,
            variableId: variableId,
            componentId: componentId,
            eventId: event.eventId,
            timestamp: event.timestamp,
            trigger: event.trigger,
            cause: event.cause,
            actualValue: event.actualValue,
            techCode: event.techCode,
            techInfo: event.techInfo,
            cleared: event.cleared,
            transactionId: event.transactionId,
            variableMonitoringId: event.variableMonitoringId,
            eventNotificationType: event.eventNotificationType,
        })
    }
}