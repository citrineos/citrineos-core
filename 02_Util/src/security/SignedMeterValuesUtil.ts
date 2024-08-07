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
 * Util to process and validate signed meter values
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
        component_name: 'OCPPCommCtrlr',
        variable_name: 'PublicKeyWithSignedMeterValue',
      });

    for (const meterValue of meterValues) {
      if (expectPublicKey.length > 0 && expectPublicKey[0].value !== 'Never') {
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
                this._signedMeterValuesConfiguration.publicKeyFileId,
              );
            } else {
              anyInvalidMeterValues = true;
            }
          } else {
            const existingPublicKey =
              await this._chargingStationSecurityInfoRepository.readChargingStationpublicKeyFileId(
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
      !this._signedMeterValuesConfiguration?.publicKeyFileId ||
      !this._signedMeterValuesConfiguration?.privateKeyFileId ||
      this._signedMeterValuesConfiguration?.encryptionMethod !== signingMethod ||
      publicKey.length === 0
    ) {
      return false;
    }

    const retrievedPublicKey = this.formatKey((
      await this._fileAccess.getFile(
        this._signedMeterValuesConfiguration.publicKeyFileId,
      )
    ).toString());

    if (retrievedPublicKey !== publicKey) {
      return false;
    }

    const retrievedPrivateKey = this.formatKey((
      await this._fileAccess.getFile(
        this._signedMeterValuesConfiguration.privateKeyFileId,
      )
    ).toString());

    switch (signingMethod) {
      case 'RSASSA-PKCS1-v1_5':
        try {
          const cryptoPrivateKey = await crypto.subtle.importKey(
            'pkcs8',
            this.str2ab(atob(retrievedPrivateKey)),
            { name: signingMethod, hash: signedMeterValue.encodingMethod},
            true,
            ['sign', 'verify']
          );

          const signatureBuffer = Buffer.from(signedMeterValue.signedMeterData, 'base64');
          // For now, we only care that the signature could be read, regardless of the value in the signature.
          await crypto.subtle.verify(signingMethod, cryptoPrivateKey, signatureBuffer, signatureBuffer);
          return true;
        } catch (e) {
          if (e instanceof DOMException) {
            this._logger.warn(`Error decrypting private key or verifying signature from Signed Meter Value. Error: ${JSON.stringify(e.message)}`);
          }
          return false;
        }
      default:
        this._logger.warn(`${signingMethod} is not supported for Signed Meter Values.`);
        return false;
    }
  }

  private formatKey(key: string) {
    return key
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/(\r\n|\n|\r)/gm, '');
  }

  private str2ab(str: string){
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}