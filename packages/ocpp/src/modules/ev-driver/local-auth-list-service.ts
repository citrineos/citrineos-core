// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AttributeEnum, OCPP1_6, UpdateEnum, OCPP2_request_types } from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import type {
  IChangeConfigurationRepository,
  IDeviceModelRepository,
  ILocalAuthListRepository,
} from '@citrineos/dal';
import {
  SendLocalList,
  Variable,
  VariableAttribute,
  LocalListVersion,
  LocalListAuthorization,
} from '@citrineos/dal';

export class LocalAuthListService {
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _changeConfigurationRepository: IChangeConfigurationRepository;
  protected _logger: Logger<ILogObj>;

  constructor({
    localAuthListRepository,
    deviceModelRepository,
    changeConfigurationRepository,
    logger,
  }: {
    localAuthListRepository: ILocalAuthListRepository;
    deviceModelRepository: IDeviceModelRepository;
    changeConfigurationRepository: IChangeConfigurationRepository;
    logger: Logger<ILogObj>;
  }) {
    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._changeConfigurationRepository = changeConfigurationRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async prepareSendLocalList(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalListRequest: OCPP2_request_types.SendLocalListRequest,
  ): Promise<string> {
    const correlationId = uuidv4();
    await this.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
      tenantId,
      ocppConnectionName,
      correlationId,
      sendLocalListRequest,
    );
    return correlationId;
  }

  async prepareSendLocalList16(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalListRequest: OCPP1_6.SendLocalListRequest,
  ): Promise<string> {
    const correlationId = uuidv4();
    await this.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest16(
      tenantId,
      ocppConnectionName,
      correlationId,
      sendLocalListRequest,
    );
    return correlationId;
  }

  /**
   * Validates a SendLocalListRequest and persists it, then returns the correlation Id.
   *
   * @param ocppConnectionName - The connection name of the charging station
   * @param {string} correlationId - The correlation Id that will be used for the SendLocalListRequest.
   * @param {SendLocalListRequest} sendLocalListRequest - The SendLocalListRequest to validate and persist.
   * @return {SendLocalList} The persisted SendLocalList.
   */
  async persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
    sendLocalListRequest: OCPP2_request_types.SendLocalListRequest,
  ): Promise<SendLocalList> {
    const localListVersion = await this._localAuthListRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
      },
      include: [LocalListAuthorization],
    });
    const sendLocalList = await this.createSendLocalListFromStationIdAndRequestAndCurrentVersion(
      tenantId,
      ocppConnectionName,
      correlationId,
      sendLocalListRequest,
      localListVersion,
    );

    const newLocalAuthListLength = await this.countUpdatedAuthListFromRequestAndCurrentVersion(
      sendLocalList,
      localListVersion,
    );
    // DeviceModelRefactor: If different variable characteristics are allowed for the same variable, per station, then we need to update this
    const maxLocalAuthListEntries = await this.getMaxLocalAuthListEntries(
      tenantId,
      ocppConnectionName,
    );
    if (maxLocalAuthListEntries == null) {
      this._logger.warn(
        `Station ${ocppConnectionName} did not report a LocalAuthListCtrlr.Entries maxLimit ` +
          `(required by D01.FR.12); forwarding SendLocalList without enforcing the max entries.`,
      );
    } else if (newLocalAuthListLength > maxLocalAuthListEntries) {
      throw new Error(
        `Updated local auth list length (${newLocalAuthListLength}) will exceed max local auth list entries (${maxLocalAuthListEntries})`,
      );
    }

    const itemsPerMessageSendLocalList =
      (await this.getItemsPerMessageSendLocalListByStationId(tenantId, ocppConnectionName)) ||
      (sendLocalListRequest.localAuthorizationList
        ? sendLocalListRequest.localAuthorizationList?.length
        : 0);

    if (
      itemsPerMessageSendLocalList &&
      sendLocalListRequest.localAuthorizationList &&
      itemsPerMessageSendLocalList < sendLocalListRequest.localAuthorizationList.length
    ) {
      throw new Error(
        `Number of authorizations (${sendLocalListRequest.localAuthorizationList.length}) in SendLocalListRequest (${JSON.stringify(sendLocalListRequest)}) exceeds itemsPerMessageSendLocalList (${itemsPerMessageSendLocalList}) (see D01.FR.11; break list up into multiple SendLocalListRequests of at most ${itemsPerMessageSendLocalList} authorizations by sending one with updateType Full and additional with updateType Differential until all authorizations have been sent)`,
      );
    }

    return sendLocalList;
  }

  private async createSendLocalListFromStationIdAndRequestAndCurrentVersion(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
    sendLocalListRequest: OCPP2_request_types.SendLocalListRequest,
    localListVersion?: LocalListVersion,
  ): Promise<SendLocalList> {
    if (sendLocalListRequest.versionNumber <= 0) {
      throw new Error(
        `Version number ${sendLocalListRequest.versionNumber} must be greater than 0, see D01.FR.18`,
      );
    }

    if (localListVersion && localListVersion.versionNumber >= sendLocalListRequest.versionNumber) {
      throw new Error(
        `Current LocalListVersion for ${ocppConnectionName} is ${localListVersion.versionNumber}, cannot send LocalListVersion ${sendLocalListRequest.versionNumber} (version number must be higher)`,
      );
    }

    if (
      sendLocalListRequest.localAuthorizationList &&
      sendLocalListRequest.localAuthorizationList.length > 1
    ) {
      // Check for duplicate authorizations
      const idTokens = sendLocalListRequest.localAuthorizationList.map(
        (auth) => auth.idToken.idToken + auth.idToken.type,
      );
      if (new Set(idTokens).size !== idTokens.length) {
        throw new Error(`Duplicated idToken in SendLocalList ${JSON.stringify(idTokens)}`);
      }
    }

    return await this._localAuthListRepository.createSendLocalListFromRequestData(
      tenantId,
      ocppConnectionName,
      correlationId,
      sendLocalListRequest.updateType,
      sendLocalListRequest.versionNumber,
      sendLocalListRequest.localAuthorizationList ?? undefined,
    );
  }

  private async countUpdatedAuthListFromRequestAndCurrentVersion(
    sendLocalList: SendLocalList,
    localListVersion?: LocalListVersion,
  ): Promise<number> {
    switch (sendLocalList?.updateType) {
      case UpdateEnum.Full:
        return sendLocalList?.localAuthorizationList?.length ?? 0;
      case UpdateEnum.Differential: {
        const uniqueAuths = new Set(
          [
            ...(sendLocalList.localAuthorizationList ?? []),
            ...(localListVersion?.localAuthorizationList ?? []),
          ].map((auth) => auth.authorizationId),
        );
        return uniqueAuths.size;
      }
      default:
        throw new Error(`Unknown update type ${sendLocalList?.updateType}`);
    }
  }

  private async getItemsPerMessageSendLocalListByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null> {
    const itemsPerMessageSendLocalList: VariableAttribute[] =
      await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        component_name: 'LocalAuthListCtrlr',
        component_instance: null,
        variable_name: 'ItemsPerMessage',
        variable_instance: null,
        type: AttributeEnum.Actual,
      });
    if (itemsPerMessageSendLocalList.length === 0) {
      return null;
    } else {
      return Number(itemsPerMessageSendLocalList[0].value);
    }
  }

  async persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest16(
    tenantId: number,
    stationId: string,
    correlationId: string,
    sendLocalListRequest: OCPP1_6.SendLocalListRequest,
  ): Promise<SendLocalList> {
    const localListVersion = await this._localAuthListRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName: stationId,
      },
      include: [LocalListAuthorization],
    });

    if (sendLocalListRequest.listVersion <= 0) {
      throw new Error(`listVersion ${sendLocalListRequest.listVersion} must be greater than 0`);
    }

    if (localListVersion && localListVersion.versionNumber >= sendLocalListRequest.listVersion) {
      throw new Error(
        `Current LocalListVersion for ${stationId} is ${localListVersion.versionNumber}, cannot send LocalListVersion ${sendLocalListRequest.listVersion} (version number must be higher)`,
      );
    }

    const list = sendLocalListRequest.localAuthorizationList ?? [];
    if (list.length > 1) {
      const idTags = list.map((entry) => entry.idTag);
      if (new Set(idTags).size !== idTags.length) {
        throw new Error(`Duplicated idTag in SendLocalListRequest: ${JSON.stringify(idTags)}`);
      }
    }

    const sendLocalListMaxLength = await this.getOcpp16ConfigurationNumber(
      tenantId,
      stationId,
      'SendLocalListMaxLength',
    );
    if (sendLocalListMaxLength === null) {
      this._logger.warn(
        `Station ${stationId} has not reported SendLocalListMaxLength; forwarding SendLocalList ` +
          `without enforcing the per-message length.`,
      );
    } else if (list.length > sendLocalListMaxLength) {
      throw new Error(
        `Number of authorizations (${list.length}) in SendLocalListRequest exceeds ` +
          `SendLocalListMaxLength (${sendLocalListMaxLength}) reported by ${stationId} ` +
          `(break the list up into a Full request followed by Differential ones)`,
      );
    }

    const localAuthListMaxLength = await this.getOcpp16ConfigurationNumber(
      tenantId,
      stationId,
      'LocalAuthListMaxLength',
    );
    if (localAuthListMaxLength === null) {
      this._logger.warn(
        `Station ${stationId} has not reported LocalAuthListMaxLength; forwarding SendLocalList ` +
          `without enforcing the maximum list length.`,
      );
    } else {
      const updatedLength = this.countUpdatedAuthList16(sendLocalListRequest, localListVersion);
      if (updatedLength > localAuthListMaxLength) {
        throw new Error(
          `Updated local auth list length (${updatedLength}) will exceed ` +
            `LocalAuthListMaxLength (${localAuthListMaxLength}) reported by ${stationId}`,
        );
      }
    }

    return await this._localAuthListRepository.createSendLocalListFromRequestData16(
      tenantId,
      stationId,
      correlationId,
      sendLocalListRequest.updateType,
      sendLocalListRequest.listVersion,
      sendLocalListRequest.localAuthorizationList ?? undefined,
    );
  }

  private countUpdatedAuthList16(
    sendLocalListRequest: OCPP1_6.SendLocalListRequest,
    localListVersion?: LocalListVersion,
  ): number {
    const list = sendLocalListRequest.localAuthorizationList ?? [];
    if (sendLocalListRequest.updateType === OCPP1_6.SendLocalListRequestUpdateType.Full) {
      return list.length;
    }

    const idTags = new Set(
      (localListVersion?.localAuthorizationList ?? []).map((auth) => auth.idToken),
    );
    for (const entry of list) {
      if (!entry.idTag) {
        continue;
      }
      if (entry.idTagInfo) {
        idTags.add(entry.idTag);
      } else {
        idTags.delete(entry.idTag);
      }
    }
    return idTags.size;
  }

  private async getOcpp16ConfigurationNumber(
    tenantId: number,
    ocppConnectionName: string,
    key: string,
  ): Promise<number | null> {
    const configuration = await this._changeConfigurationRepository.findByStationAndKey(
      tenantId,
      ocppConnectionName,
      key,
    );
    if (configuration?.value == null) {
      return null;
    }
    const value = Number(configuration.value);
    return Number.isFinite(value) ? value : null;
  }

  private async getMaxLocalAuthListEntries(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null> {
    const entriesAttributes: VariableAttribute[] =
      await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        component_name: 'LocalAuthListCtrlr',
        variable_name: 'Entries',
        type: AttributeEnum.Actual,
      });

    const maxLimit = (entriesAttributes[0]?.variable as Variable | undefined)
      ?.variableCharacteristics?.maxLimit;
    return maxLimit ?? null;
  }
}
