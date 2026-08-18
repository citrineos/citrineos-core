// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AttributeEnum, OCPP1_6, UpdateEnum, OCPP2_request_types } from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';
import type {
  IDeviceModelRepository,
  ILocalAuthListRepository,
} from '@dal/interfaces/repositories.js';
import {
  SendLocalList,
  Variable,
  VariableAttribute,
  LocalListVersion,
  LocalListAuthorization,
} from '@dal/layers/sequelize/index.js';

export class LocalAuthListService {
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _logger: Logger<ILogObj>;

  constructor({
    localAuthListRepository,
    deviceModelRepository,
    logger,
  }: {
    localAuthListRepository: ILocalAuthListRepository;
    deviceModelRepository: IDeviceModelRepository;
    logger: Logger<ILogObj>;
  }) {
    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
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

  /**
   * OCPP 1.6 variant: validate and persist a SendLocalListRequest, returning the persisted row.
   * Mirrors the 2.0.1 path but uses flat idTag and 1.6 update enum. Item-count limits for 1.6
   * come from the chargepoint via `LocalAuthListMaxLength` configuration; absence is non-fatal.
   */
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

    return await this._localAuthListRepository.createSendLocalListFromRequestData16(
      tenantId,
      stationId,
      correlationId,
      sendLocalListRequest.updateType,
      sendLocalListRequest.listVersion,
      sendLocalListRequest.localAuthorizationList ?? undefined,
    );
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
