// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AttributeEnumType, AuthorizationData, deepDirectionalEqual, SendLocalListRequest, UpdateEnumType } from "@citrineos/base";
import { Authorization, IDeviceModelRepository, ILocalAuthListRepository, VariableCharacteristics, VariableAttribute, IAuthorizationRepository, IdToken } from "@citrineos/data";


export class LocalAuthListService {
  protected _authorizationRepository: IAuthorizationRepository;
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor(authorizationRepository: IAuthorizationRepository,
    localAuthListRepository: ILocalAuthListRepository,
    deviceModelRepository: IDeviceModelRepository
  ) {
    this._authorizationRepository = authorizationRepository;
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
  async validateAndPersistSendLocalListRequestFromMessageAPI(stationId: string, sendLocalListRequest: SendLocalListRequest): Promise<string> {
    const sendLocalList = await this._localAuthListRepository.createSendLocalListFromStationIdAndRequest(stationId, sendLocalListRequest);
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

  async createSendLocalListRequestsFromAuthorizationsAndStationId(authorizations: Authorization[], stationId: string): Promise<AsyncGenerator<SendLocalListRequest>> {
    const maxLocalAuthListEntries = await this.getMaxLocalAuthListEntries();
    if (!maxLocalAuthListEntries) {
      throw new Error('Could not get max local auth list entries, required by D01.FR.12');
    } else if (authorizations.length > maxLocalAuthListEntries) {
      throw new Error(`Local auth list length (${authorizations.length}) exceeds max local auth list entries (${maxLocalAuthListEntries})`);
    }

    const itemsPerMessageSendLocalList =
      await this.getItemsPerMessageSendLocalListByStationId(stationId)
      || authorizations.length;

    return this.generateSendLocalListRequestsFromMaxLengthAndAuthorizationsAndStationId(itemsPerMessageSendLocalList, authorizations, stationId);
  }

  async *generateSendLocalListRequestsFromMaxLengthAndAuthorizationsAndStationId(itemsPerMessageSendLocalList: number, authorizations: Authorization[], stationId: string): AsyncGenerator<SendLocalListRequest> {
    let i = 0;
    let updateType = UpdateEnumType.Full;
    while (i < authorizations.length) {
      const sendLocalListAuthList = authorizations.slice(i, i + itemsPerMessageSendLocalList) as [Authorization, ...Authorization[]];
      const sendLocalList = await this._localAuthListRepository.createSendLocalList(stationId, updateType, undefined, sendLocalListAuthList);
      i += itemsPerMessageSendLocalList;
      updateType = UpdateEnumType.Differential;
      yield sendLocalList.toSendLocalListRequest();
    }
  }

  async getItemsPerMessageSendLocalListByStationId(
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

  async getMaxLocalAuthListEntries(): Promise<number | null> {
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