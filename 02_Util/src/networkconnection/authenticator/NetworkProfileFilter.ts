import { ILogObj, Logger } from 'tslog';
import {
  ChargingStationNetworkProfile,
  IDeviceModelRepository,
  ServerNetworkProfile,
} from '@citrineos/data';
import { IncomingMessage } from 'http';
import { AuthenticatorFilter } from './AuthenticatorFilter';
import { AuthenticationOptions, OCPP2_0_1 } from '@citrineos/base';
import { UpgradeAuthenticationError } from './errors/AuthenticationError';

/**
 * Filter used to block connections when charging stations attempt to connect to disallowed security profiles
 */
export class NetworkProfileFilter extends AuthenticatorFilter {
  private _deviceModelRepository: IDeviceModelRepository;

  constructor(deviceModelRepository: IDeviceModelRepository, logger?: Logger<ILogObj>) {
    super(logger);
    this._deviceModelRepository = deviceModelRepository;
  }

  protected shouldFilter(_options: AuthenticationOptions): boolean {
    return true;
  }

  protected async filter(
    tenantId: number,
    identifier: string,
    request: IncomingMessage,
    options: AuthenticationOptions,
  ): Promise<void> {
    const isConfigurationSlotAllowed = await this._isConfigurationSlotAllowed(
      tenantId,
      identifier,
      options.securityProfile,
    );
    if (!isConfigurationSlotAllowed) {
      throw new UpgradeAuthenticationError(
        `SecurityProfile not allowed ${options.securityProfile}`,
      );
    }
  }

  private async _isConfigurationSlotAllowed(
    tenantId: number,
    identifier: string,
    securityProfile: number,
  ) {
    const r = await this._deviceModelRepository.readAllByQuerystring(tenantId, {
      tenantId,
      stationId: identifier,
      component_name: 'OCPPCommCtrlr',
      variable_name: 'NetworkConfigurationPriority',
      type: OCPP2_0_1.AttributeEnumType.Actual,
    });
    if (r && r[0]) {
      const configurationSlotsString = r[0].value;
      if (configurationSlotsString && configurationSlotsString.trim() !== '') {
        // Split the string by commas to get an array of string numbers
        const configurationSlotStringsArray = configurationSlotsString.split(',');
        // Parse the array into numbers and filter out the rest
        const configurationSlotsArray = configurationSlotStringsArray
          .map((configurationSlotString) => parseInt(configurationSlotString, 10))
          .filter((configurationSlotId) => {
            if (isNaN(configurationSlotId)) {
              this._logger.error(
                'NetworkConfigurationPriority elements must be integers: ' +
                  configurationSlotsString,
              );
              return false;
            } else {
              return true;
            }
          });

        if (configurationSlotsArray.length == 0) {
          this._logger.debug('No valid configuration slots to check: ' + configurationSlotsString);
          return true;
        } else {
          let securityProfileAllowed = false;
          for (const configurationSlot of configurationSlotsArray) {
            const chargingStationNetworkProfile = await ChargingStationNetworkProfile.findOne({
              where: { stationId: identifier, configurationSlot: configurationSlot },
            });
            if (chargingStationNetworkProfile) {
              const serverNetworkProfile = await ServerNetworkProfile.findByPk(
                chargingStationNetworkProfile.websocketServerConfigId,
              );
              if (serverNetworkProfile && securityProfile >= serverNetworkProfile.securityProfile) {
                this._logger.debug('Security profile allowed');
                securityProfileAllowed = true;
              }
            } else {
              this._logger.warn(
                'Unknown configuration slot; skipping security profile network profile check.',
              );
              securityProfileAllowed = true;
            }
          }
          if (!securityProfileAllowed) {
            this._logger.warn(
              `Station ${identifier} unable to connect with security profile ${securityProfile}`,
            );
          }
          return securityProfileAllowed;
        }
      }
    }
    this._logger.warn('Has no configuration slots configured');
    return true;
  }
}
