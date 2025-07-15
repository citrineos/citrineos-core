import { IChargingStationSecurityInfoRepository, sequelize } from '@citrineos/data';
import {
  BootstrapConfig,
  IFileStorage,
  OCPP2_0_1,
  SignedMeterValuesConfig,
  SystemConfig,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import * as crypto from 'node:crypto';
import { stringToArrayBuffer } from 'pvutils';

/**
 * Util to process and validate signed meter values.
 */
export class SignedMeterValuesUtil {
  private readonly _fileStorage: IFileStorage;
  private readonly _logger: Logger<ILogObj>;
  private readonly _chargingStationSecurityInfoRepository: IChargingStationSecurityInfoRepository;

  private readonly _signedMeterValuesConfiguration: SignedMeterValuesConfig | undefined;

  /**
   * @param {IFileStorage} [fileStorage] - The `fileStorage` allows access to the configured file storage.
   *
   * @param {BootstrapConfig & SystemConfig} config - The `config` contains the current system configuration settings.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` represents an instance of {@link Logger<ILogObj>}.
   *
   */
  constructor(
    fileStorage: IFileStorage,
    config: BootstrapConfig & SystemConfig,
    logger: Logger<ILogObj>,
  ) {
    this._fileStorage = fileStorage;
    this._logger = logger;
    this._chargingStationSecurityInfoRepository =
      new sequelize.SequelizeChargingStationSecurityInfoRepository(config, logger);

    this._signedMeterValuesConfiguration =
      config.modules.transactions.signedMeterValuesConfiguration;
  }

  /**
   * Checks the validity of a meter value.
   *
   * If a meter value is unsigned, it is valid.
   *
   * If a meter value is signed, it is valid if:
   * - SignedMeterValuesConfig is configured
   * AND
   * - The incoming signed meter value's signing method matches the configured signing method
   * AND
   * - The incoming signed meter value's public key is empty but there is a public key stored for that charging station
   * OR
   * - The incoming signed meter value's public key isn't empty and it matches the configured public key
   *
   * @param stationId - The charging station the meter values belong to
   * @param meterValues - The list of meter values
   */
  public async validateMeterValues(
    tenantId: number,
    stationId: string,
    meterValues: [OCPP2_0_1.MeterValueType, ...OCPP2_0_1.MeterValueType[]],
  ): Promise<boolean> {
    for (const meterValue of meterValues) {
      for (const sampledValue of meterValue.sampledValue) {
        if (sampledValue.signedMeterValue) {
          const validMeterValues = await this.validateSignedSampledValue(
            tenantId,
            stationId,
            sampledValue.signedMeterValue,
          );
          if (!validMeterValues) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private async validateSignedSampledValue(
    tenantId: number,
    stationId: string,
    signedMeterValue: OCPP2_0_1.SignedMeterValueType,
  ): Promise<boolean> {
    if (signedMeterValue.publicKey && signedMeterValue.publicKey.length > 0) {
      const incomingPublicKeyIsValid =
        await this.validateSignedMeterValueSignature(signedMeterValue);

      if (this._signedMeterValuesConfiguration && incomingPublicKeyIsValid) {
        await this._chargingStationSecurityInfoRepository.readOrCreateChargingStationInfo(
          tenantId,
          stationId,
          this._signedMeterValuesConfiguration.publicKeyFileId,
        );

        return true;
      } else {
        return false;
      }
    } else {
      const chargingStationPublicKeyFileId =
        await this._chargingStationSecurityInfoRepository.readChargingStationPublicKeyFileId(
          tenantId,
          stationId,
        );
      return await this.validateSignedMeterValueSignature(
        signedMeterValue,
        chargingStationPublicKeyFileId,
      );
    }
  }

  private async validateSignedMeterValueSignature(
    signedMeterValue: OCPP2_0_1.SignedMeterValueType,
    publicKeyFileId?: string,
  ): Promise<boolean> {
    const incomingPublicKeyString = signedMeterValue.publicKey;
    const signingMethod = signedMeterValue.signingMethod;

    if (!this._signedMeterValuesConfiguration?.publicKeyFileId) {
      this._logger.warn('Invalid signature because public key is missing from system config.');
      return false;
    }

    if (
      publicKeyFileId &&
      publicKeyFileId !== this._signedMeterValuesConfiguration?.publicKeyFileId
    ) {
      this._logger.warn(
        'Invalid signature because incoming public key does not match configured public key.',
      );
      return false;
    }

    if (!publicKeyFileId && incomingPublicKeyString.length === 0) {
      this._logger.warn(
        'Invalid signature because no configured public key and incoming signed meter values has no public key.',
      );
      return false;
    }

    if (this._signedMeterValuesConfiguration?.signingMethod !== signingMethod) {
      this._logger.warn(
        'Invalid signature because incoming signing method does not match configured signing method.',
      );
      return false;
    }

    const configuredPublicKey = this.formatKey(
      await this._fileStorage.getFile(this._signedMeterValuesConfiguration.publicKeyFileId),
    );

    if (incomingPublicKeyString.length > 0) {
      const signedMeterValuePublicKey = Buffer.from(
        signedMeterValue.publicKey,
        'base64',
      ).toString();

      if (configuredPublicKey !== signedMeterValuePublicKey) {
        return false;
      }
    }

    switch (signingMethod) {
      case 'RSASSA-PKCS1-v1_5':
        return await this.validateRsaSignature(
          configuredPublicKey,
          signingMethod,
          signedMeterValue.encodingMethod,
          signedMeterValue.signedMeterData,
        );
      default:
        this._logger.warn(`${signingMethod} is not supported for Signed Meter Values.`);
        return false;
    }
  }

  private async validateRsaSignature(
    configuredPublicKey: string,
    signingMethod: string,
    encodingMethod: string,
    signatureData: string,
  ): Promise<boolean> {
    try {
      const cryptoPublicKey = await crypto.subtle.importKey(
        'spki',
        stringToArrayBuffer(atob(configuredPublicKey)),
        { name: signingMethod, hash: encodingMethod },
        true,
        ['verify'],
      );

      const signatureBuffer = Buffer.from(signatureData, 'base64');
      // For now, we only care that the signature could be read, regardless of the value in the signature.
      await crypto.subtle.verify(signingMethod, cryptoPublicKey, signatureBuffer, signatureBuffer);
      return true;
    } catch (e) {
      const errorMessage = e instanceof DOMException ? e.message : JSON.stringify(e);
      this._logger.warn(
        `Error decrypting public key or verifying signature from Signed Meter Value. Error: ${errorMessage}`,
      );
      return false;
    }
  }

  private formatKey(key: string | undefined): string {
    if (!key) {
      throw new Error('Public key file is missing.');
    }
    return key
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/(\r\n|\n|\r)/gm, '');
  }
}
