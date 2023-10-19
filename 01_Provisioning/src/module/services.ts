import { BootConfig, BootNotificationResponse, RegistrationStatusEnumType, SystemConfig } from "@citrineos/base";
import { IBootRepository } from "@citrineos/data";
import { Boot } from "@citrineos/data/lib/layers/sequelize";



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