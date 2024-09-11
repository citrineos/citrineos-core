// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AttributeEnumType, AuthorizationData, SendLocalListRequest, UpdateEnumType } from "@citrineos/base";
import { IDeviceModelRepository, ILocalAuthListRepository, VariableCharacteristics, VariableAttribute, } from "@citrineos/data";
import { LocalListAuthorization } from "@citrineos/data/src/layers/sequelize/model/Authorization/LocalListAuthorization";


export class LocalAuthListService {
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor(localAuthListRepository: ILocalAuthListRepository,
    deviceModelRepository: IDeviceModelRepository
  ) {
    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
  }

  /**
   * Validates a SendLocalListRequest and persists it to the local auth list.
   *
   * @param {string} stationId - The ID of the station to which the SendLocalListRequest belongs.
   * @param {SendLocalListRequest} sendLocalListRequest - The SendLocalListRequest to validate and persist.
   * @return {string} The correlation ID of the persisted SendLocalList.
   */
  async persistAndGenerateCorrelationIdForStationIdAndSendLocalListRequest(stationId: string, sendLocalListRequest: SendLocalListRequest): Promise<string> {
    const sendLocalList = await this.createSendLocalListFromStationIdAndRequest(stationId, sendLocalListRequest.updateType, sendLocalListRequest.versionNumber, sendLocalListRequest.localAuthorizationList ?? undefined);
    const authorizations = sendLocalListRequest.localAuthorizationList;

    const newLocalAuthListLength = await this._localAuthListRepository.countUpdatedAuthListFromStationIdAndCorrelationId(stationId, sendLocalList.correlationId);
    // TODO If Device Model is updated to allow different variable characteristics for the same variable per station, then we need to update this
    const maxLocalAuthListEntries = await this.getMaxLocalAuthListEntries();
    if (!maxLocalAuthListEntries) {
      throw new Error('Could not get max local auth list entries, required by D01.FR.12');
    } else if (newLocalAuthListLength > maxLocalAuthListEntries) {
      throw new Error(`Updated local auth list length (${newLocalAuthListLength}) will exceed max local auth list entries (${maxLocalAuthListEntries})`);
    }

    const itemsPerMessageSendLocalList =
      await this.getItemsPerMessageSendLocalListByStationId(stationId)
      || (authorizations ? authorizations?.length : 0);

    if (itemsPerMessageSendLocalList && authorizations && itemsPerMessageSendLocalList < authorizations.length) {
      throw new Error(`Number of authorizations (${authorizations.length}) in SendLocalListRequest (${JSON.stringify(sendLocalListRequest)}) exceeds itemsPerMessageSendLocalList (${itemsPerMessageSendLocalList}) (see D01.FR.11; break list up into multiple SendLocalListRequests of at most ${itemsPerMessageSendLocalList} authorizations by sending one with updateType Full and additional with updateType Differential until all authorizations have been sent)`);
    }

    return sendLocalList.correlationId;
  }

  private async createSendLocalListFromStationIdAndRequest(stationId: string, updateType: UpdateEnumType, versionNumber?: number, localAuthorizationList?: AuthorizationData[]): Promise<SendLocalList> {
    if (versionNumber) {
      if (versionNumber <= 0) {
        throw new Error(`Version number ${versionNumber} must be greater than 0, see D01.FR.18`)
      }
      const localListVersion = await this._localAuthListRepository.readOnlyOneByQuery({
        where: {
          stationId: stationId,
        },
        include: [LocalListAuthorization],
      });
      if (localListVersion && localListVersion.versionNumber >= versionNumber) {
        throw new Error(`Current LocalListVersion for ${stationId} is ${localListVersion.versionNumber}, cannot send LocalListVersion ${versionNumber} (version number must be higher)`);
      }
    } else {
      versionNumber = await this._localAuthListRepository.getNextVersionNumberForStation(stationId);
    }

    if (localAuthorizationList && localAuthorizationList.length > 1) { // Check for duplicate authorizations
      const idTokens = localAuthorizationList.map(auth => auth.idToken.idToken + auth.idToken.type);
      if (new Set(idTokens).size !== idTokens.length) {
        throw new Error(`Duplicated idToken in SendLocalList ${JSON.stringify(idTokens)}`);
      }
    }

    return await this._localAuthListRepository.createSendLocalListFromRequestData(stationId, updateType, versionNumber, localAuthorizationList);
  }

  private async getItemsPerMessageSendLocalListByStationId(
    stationId: string,
  ): Promise<number | null> {
    const itemsPerMessageSendLocalList: VariableAttribute[] =
      await this._deviceModelRepository.readAllByQuerystring({
        stationId: stationId,
        component_name: 'LocalAuthListCtrlr',
        component_instance: null,
        variable_name: 'ItemsPerMessage',
        variable_instance: null,
        type: AttributeEnumType.Actual,
      });
    if (itemsPerMessageSendLocalList.length === 0) {
      return null;
    } else {
      return Number(itemsPerMessageSendLocalList[0].value);
    }
  }

  private async getMaxLocalAuthListEntries(): Promise<number | null> {
    const localAuthListEntriesCharacteristics: VariableCharacteristics | undefined =
      await this._deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance(
        'Entries',
        null,);
    if (!localAuthListEntriesCharacteristics || !localAuthListEntriesCharacteristics.maxLimit) {
      return null;
    } else {
      return localAuthListEntriesCharacteristics.maxLimit;
    }
  }
}