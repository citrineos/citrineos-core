import { AttributeEnumType, BootConfig, BootNotificationResponse, ChargingStationType, MutabilityEnumType, RegistrationStatusEnumType, SystemConfig } from "@citrineos/base";
import { IBootRepository, IDeviceModelRepository } from "@citrineos/data";
import { Boot, VariableAttribute } from "@citrineos/data/lib/layers/sequelize";



export class BootService {

    protected _bootRepository: IBootRepository;

    constructor(
        bootRepository: IBootRepository) {
        this._bootRepository = bootRepository;
    }

    /**
     * Generates a boot notification response from a combination of SystemConfig and charger-specific BootConfig.
     * Unknown chargers, chargers without a BootConfig, will use SystemConfig.unknownChargerStatus for status.
     * When any other BootConfig field is not set, the corresponding field on the SystemConfig will be used.
     * After booting for the first time, a BootConfig will be made for unknown chargers.
     * @param stationId Charging station identifier.
     * @param systemConfig System-wide configuration used for unknown chargers (chargers without BootConfig) or as the default when a BootConfig field is not set.
     * @returns BootNotificationResponse to be sent to charger.
     */
    async generateBootNotificationResponse(stationId: string, systemConfig: SystemConfig): Promise<BootNotificationResponse> {
        const bootConfig = await this._bootRepository.readByKey(stationId)
        let bootStatus = bootConfig ? bootConfig.status : systemConfig.provisioning.unknownChargerStatus;

        // Pending status only stays if there are actions to take for configuration
        if (bootStatus == RegistrationStatusEnumType.Pending) {
            let needToGetBaseReport = systemConfig.provisioning.getBaseReportOnPending;
            let needToSetVariables = false;
            if (bootConfig) {
                if (bootConfig.getBaseReportOnPending !== undefined && bootConfig.getBaseReportOnPending !== null) {
                    needToGetBaseReport = bootConfig.getBaseReportOnPending;
                }
                if (bootConfig.pendingBootSetVariables && bootConfig.pendingBootSetVariables.length > 0) {
                    needToSetVariables = true
                }
            }
            if (!needToGetBaseReport && !needToSetVariables) {
                bootStatus = RegistrationStatusEnumType.Accepted;
            }
        }

        return {
            currentTime: new Date().toISOString(),
            status: bootStatus,
            statusInfo: bootConfig?.statusInfo,
            interval: bootStatus == RegistrationStatusEnumType.Accepted ?
                // Accepted == heartbeat interval
                (bootConfig?.heartbeatInterval ? bootConfig.heartbeatInterval : systemConfig.provisioning.heartbeatInterval) :
                // Pending or Rejected == boot retry interval
                (bootConfig?.bootRetryInterval ? bootConfig.bootRetryInterval : systemConfig.provisioning.bootRetryInterval)
        };
    }

    /**
     * Updates boot config from a boot notification response and returns the DB entity for further use.
     * Throws an error if db is unable to save.
     * @param stationId Charging station identifier.
     * @param bootNotificationResponse Successfully sent bootNotificationResponse.
     * @returns Boot Db entity
     */
    async updateBootConfigFromBootNotificationResponse(stationId: string, bootNotificationResponse: BootNotificationResponse): Promise<Boot> {
        let bootConfig: Boot | undefined = await this._bootRepository.readByKey(stationId);
        if (!bootConfig) {
            const unknownChargerBootConfig: BootConfig = {
                status: bootNotificationResponse.status,
                statusInfo: bootNotificationResponse.statusInfo
            }
            bootConfig = await this._bootRepository.createOrUpdateByKey(unknownChargerBootConfig, stationId);
        }
        if (!bootConfig) {
            throw new Error("Unable to create/update BootConfig...");
        } else {
            bootConfig.lastBootTime = bootNotificationResponse.currentTime;
            return bootConfig.save();
        }
    }
}

export class DeviceModelService {

    protected _deviceModelRepository: IDeviceModelRepository;

    constructor(
        deviceModelRepository: IDeviceModelRepository) {
        this._deviceModelRepository = deviceModelRepository;
    }

    /**
     * Saves information from BootNotificationRequest to device model.
     * @param chargingStation Charging station details from BootNotificationRequest
     * @param stationId Charging station identifier
     */
    async updateBootAttributes(chargingStation: ChargingStationType, stationId: string) {
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
            component: {
                name: "ChargingStation"
            },
            variable: {
                name: "SerialNumber"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.serialNumber,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
            component: {
                name: "ChargingStation"
            },
            variable: {
                name: "Model"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.model,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
            component: {
                name: "ChargingStation"
            },
            variable: {
                name: "VendorName"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.vendorName,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
            component: {
                name: "Controller"
            },
            variable: {
                name: "FirmwareVersion"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.firmwareVersion,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
            component: {
                name: "DataLink"
            },
            variable: {
                name: "IMSI"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.modem?.imsi,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
            component: {
                name: "DataLink"
            },
            variable: {
                name: "ICCID"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.modem?.iccid,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
    }

    /**
     * Fetches the ItemsPerMessageSetVariables attribute from the device model.
     * Returns null if no such attribute exists.
     * It is possible for there to be multiple ItemsPerMessageSetVariables attributes if component instances or evses
     * are associated with alternate options. That structure is not supported by this logic, and that
     * structure is a violation of Part 2 - Specification of OCPP 2.0.1.
     * In that case, the first attribute will be returned.
     * @param stationId Charging station identifier.
     * @returns ItemsPerMessageSetVariables as a number or null if no such attribute exists.
     */
    async getItemsPerMessageSetVariablesByStationId(stationId: string): Promise<number | null> {
        const itemsPerMessageSetVariablesAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
            stationId: stationId,
            component_name: 'DeviceDataCtrlr',
            variable_name: 'ItemsPerMessage',
            variable_instance: 'SetVariables',
            type: AttributeEnumType.Actual
        });
        if (itemsPerMessageSetVariablesAttributes.length == 0) {
            return null;
        } else {
            // It is possible for itemsPerMessageSetVariablesAttributes.length > 1 if component instances or evses
            // are associated with alternate options. That structure is not supported by this logic, and that
            // structure is a violation of Part 2 - Specification of OCPP 2.0.1.
            return Number(itemsPerMessageSetVariablesAttributes[0].value);
        }
    }

    /**
     * Fetches the ItemsPerMessageGetVariables attribute from the device model.
     * Returns null if no such attribute exists.
     * It is possible for there to be multiple ItemsPerMessageGetVariables attributes if component instances or evses
     * are associated with alternate options. That structure is not supported by this logic, and that
     * structure is a violation of Part 2 - Specification of OCPP 2.0.1.
     * In that case, the first attribute will be returned.
     * @param stationId Charging station identifier.
     * @returns ItemsPerMessageGetVariables as a number or null if no such attribute exists.
     */
        async getItemsPerMessageGetVariablesByStationId(stationId: string): Promise<number | null> {
            const itemsPerMessageGetVariablesAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
                stationId: stationId,
                component_name: 'DeviceDataCtrlr',
                variable_name: 'ItemsPerMessage',
                variable_instance: 'GetVariables',
                type: AttributeEnumType.Actual
            });
            if (itemsPerMessageGetVariablesAttributes.length == 0) {
                return null;
            } else {
                // It is possible for itemsPerMessageGetVariablesAttributes.length > 1 if component instances or evses
                // are associated with alternate options. That structure is not supported by this logic, and that
                // structure is a violation of Part 2 - Specification of OCPP 2.0.1.
                return Number(itemsPerMessageGetVariablesAttributes[0].value);
            }
        }
}