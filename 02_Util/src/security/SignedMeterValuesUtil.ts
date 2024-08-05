import {
  IDeviceModelRepository,
  sequelize,
  SequelizeChargingStationSecurityInfoRepository,
} from '@citrineos/data';
import {
  IFileAccess,
  MeterValueType,
  SignedMeterValuesConfig, SignedMeterValueType,
  SystemConfig,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import * as crypto from 'node:crypto';

/**
 * Util to validate signed meter values
 */
export class SignedMeterValuesUtil {
  private readonly _fileAccess: IFileAccess;
  private readonly _logger: Logger<ILogObj>;
  private readonly _deviceModelRepository: IDeviceModelRepository;
  private readonly _chargingStationSecurityInfoRepository: SequelizeChargingStationSecurityInfoRepository;

  private readonly _signedMeterValuesConfiguration:
    | SignedMeterValuesConfig
    | undefined;

  /**
   * @param {IFileAccess} [fileAccess] - The `fileAccess` allows access to the configured file storage.
   *
   * @param {SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter that represents an instance of {@link Logger<ILogObj>}.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - `deviceModelRepository` represents a repository for accessing and manipulating variable attribute data.
   *
   */
  constructor(
    fileAccess: IFileAccess,
    config: SystemConfig,
    logger: Logger<ILogObj>,
    deviceModelRepository: IDeviceModelRepository,
  ) {
    this._fileAccess = fileAccess;
    this._logger = logger;
    this._deviceModelRepository = deviceModelRepository;
    this._chargingStationSecurityInfoRepository = new sequelize.SequelizeChargingStationSecurityInfoRepository(
      config,
      logger,
    );

    this._signedMeterValuesConfiguration = config.modules.transactions.signedMeterValuesConfiguration;
  }

  public async validateMeterValues(
    stationId: string,
    meterValues: [MeterValueType, ...MeterValueType[]]
  ): Promise<boolean> {
    let anyInvalidMeterValues = false;

    const expectPublicKey =
      await this._deviceModelRepository.readAllByQuerystring({
        stationId,
        component_instance: 'OCPPCommCtrlr',
        variable_instance: 'PublicKeyWithSignedMeterValue',
      });

    for (const meterValue of meterValues) {
      if (expectPublicKey.length > 0 && expectPublicKey[0].value === 'true') {
        for (const sampledValue of meterValue.sampledValue) {
          const signedMeterValue = sampledValue.signedMeterValue;

          if (!signedMeterValue) {
            continue;
          }

          if (signedMeterValue.publicKey && signedMeterValue.publicKey.length > 0) {
            const incomingPublicKeyIsValid =
              await this.isMeterValueSignatureValid(signedMeterValue);

            if (this._signedMeterValuesConfiguration && incomingPublicKeyIsValid) {
              await this._chargingStationSecurityInfoRepository.readOrCreateChargingStationInfo(
                stationId,
                this._signedMeterValuesConfiguration.publicKeyFileName,
              );
            } else {
              anyInvalidMeterValues = true;
            }
          } else {
            const existingPublicKey =
              await this._chargingStationSecurityInfoRepository.readChargingStationPublicKeyFileName(
                stationId,
              );
            anyInvalidMeterValues =
              anyInvalidMeterValues ||
              !(await this.isMeterValueSignatureValid(signedMeterValue, existingPublicKey));
          }
        }
      }
    }

    return anyInvalidMeterValues;
  }

  private async isMeterValueSignatureValid(signedMeterValue: SignedMeterValueType, existingPublicKey?: string): Promise<boolean> {
    const publicKey = Buffer.from((existingPublicKey ?? signedMeterValue.publicKey), 'base64').toString();
    const signingMethod = signedMeterValue.signingMethod;

    if (
      !this._signedMeterValuesConfiguration?.publicKeyFileName ||
      !this._signedMeterValuesConfiguration?.privateKeyFileName ||
      this._signedMeterValuesConfiguration?.encryptionMethod !== signingMethod ||
      publicKey.length === 0
    ) {
      return false;
    }

    const retrievedPublicKey = (
      await this._fileAccess.getFile(
        this._signedMeterValuesConfiguration.publicKeyFileName,
      )
    ).toString();

    if (retrievedPublicKey !== publicKey) {
      return false;
    }

    const retrievedPrivateKey = (
      await this._fileAccess.getFile(
        this._signedMeterValuesConfiguration.privateKeyFileName,
      )
    )

    switch (signingMethod) {
      case 'RSA':
        const cryptoPrivateKey = await crypto.subtle.importKey('raw', retrievedPrivateKey, { name: 'RSASSA-PKCS1-v1_5', hash: signedMeterValue.encodingMethod}, false, ['decrypt']);
        const decryptedData = await crypto.subtle.decrypt(signingMethod, cryptoPrivateKey, Buffer.from(signedMeterValue.signedMeterData, 'base64'));
        return decryptedData.byteLength > 0;
      default:
        this._logger.warn(`${signingMethod} is not supported for Signed Meter Values.`);
        return false;
    }
  }
}