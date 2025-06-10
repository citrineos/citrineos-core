// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import {
  IDeviceModelRepository,
  ILocalAuthListRepository,
  VariableCharacteristics,
  VariableAttribute,
  LocalListVersion,
  SendLocalList,
  LocalListAuthorization,
} from '@citrineos/data';

export class LocalAuthListService {
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor(
    localAuthListRepository: ILocalAuthListRepository,
    deviceModelRepository: IDeviceModelRepository,
  ) {
    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
  }

  /**
   * Validates a SendLocalListRequest and persists it, then returns the correlation Id.
   *
   * @param {string} stationId - The ID of the station to which the SendLocalListRequest belongs.
   * @param {string} correlationId - The correlation Id that will be used for the SendLocalListRequest.
   * @param {SendLocalListRequest} sendLocalListRequest - The SendLocalListRequest to validate and persist.
   * @return {SendLocalList} The persisted SendLocalList.
   */
  async persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
    tenantId: number,
    stationId: string,
    correlationId: string,
    sendLocalListRequest: OCPP2_0_1.SendLocalListRequest,
  ): Promise<SendLocalList> {
    const localListVersion = await this._localAuthListRepository.readOnlyOneByQuery(tenantId, {
      where: {
        stationId: stationId,
      },
      include: [LocalListAuthorization],
    });
    const sendLocalList = await this.createSendLocalListFromStationIdAndRequestAndCurrentVersion(
      tenantId,
      stationId,
      correlationId,
      sendLocalListRequest,
      localListVersion,
    );

    const newLocalAuthListLength = await this.countUpdatedAuthListFromRequestAndCurrentVersion(
      sendLocalList,
      localListVersion,
    );
    // DeviceModelRefactor: If different variable characteristics are allowed for the same variable, per station, then we need to update this
    const maxLocalAuthListEntries = await this.getMaxLocalAuthListEntries(tenantId);
    if (!maxLocalAuthListEntries) {
      throw new Error('Could not get max local auth list entries, required by D01.FR.12');
    } else if (newLocalAuthListLength > maxLocalAuthListEntries) {
      throw new Error(
        `Updated local auth list length (${newLocalAuthListLength}) will exceed max local auth list entries (${maxLocalAuthListEntries})`,
      );
    }

    const itemsPerMessageSendLocalList =
      (await this.getItemsPerMessageSendLocalListByStationId(tenantId, stationId)) ||
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
    stationId: string,
    correlationId: string,
    sendLocalListRequest: OCPP2_0_1.SendLocalListRequest,
    localListVersion?: LocalListVersion,
  ): Promise<SendLocalList> {
    if (sendLocalListRequest.versionNumber <= 0) {
      throw new Error(
        `Version number ${sendLocalListRequest.versionNumber} must be greater than 0, see D01.FR.18`,
      );
    }

    if (localListVersion && localListVersion.versionNumber >= sendLocalListRequest.versionNumber) {
      throw new Error(
        `Current LocalListVersion for ${stationId} is ${localListVersion.versionNumber}, cannot send LocalListVersion ${sendLocalListRequest.versionNumber} (version number must be higher)`,
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
      stationId,
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
      case OCPP2_0_1.UpdateEnumType.Full:
        return sendLocalList?.localAuthorizationList?.length ?? 0;
      case OCPP2_0_1.UpdateEnumType.Differential: {
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
    stationId: string,
  ): Promise<number | null> {
    const itemsPerMessageSendLocalList: VariableAttribute[] =
      await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        stationId: stationId,
        component_name: 'LocalAuthListCtrlr',
        component_instance: null,
        variable_name: 'ItemsPerMessage',
        variable_instance: null,
        type: OCPP2_0_1.AttributeEnumType.Actual,
      });
    if (itemsPerMessageSendLocalList.length === 0) {
      return null;
    } else {
      return Number(itemsPerMessageSendLocalList[0].value);
    }
  }

  private async getMaxLocalAuthListEntries(tenantId: number): Promise<number | null> {
    const localAuthListEntriesCharacteristics: VariableCharacteristics | undefined =
      await this._deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance(
        tenantId,
        'Entries',
        null,
      );
    if (!localAuthListEntriesCharacteristics || !localAuthListEntriesCharacteristics.maxLimit) {
      return null;
    } else {
      return localAuthListEntriesCharacteristics.maxLimit;
    }
  }
}
