// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AttributeEnumType, SendLocalListRequest, UpdateEnumType } from "@citrineos/base";
import { Authorization, IDeviceModelRepository, ILocalAuthListRepository, LocalListVersion, VariableAttribute } from "@citrineos/data";
import { VariableCharacteristics } from "@citrineos/data/src/layers/sequelize";


export class LocalAuthListService {
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor(localAuthListRepository: ILocalAuthListRepository,
    deviceModelRepository: IDeviceModelRepository
  ) {
    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
  }

  async createSendLocalListRequestsFromLocalAuthListAndStationId(localAuthList: Authorization[], stationId: string): Promise<AsyncGenerator<SendLocalListRequest>> {
    const maxLocalAuthListEntries = await this.getMaxLocalAuthListEntries();
    if (!maxLocalAuthListEntries) {
      throw new Error('Could not get max local auth list entries, required by D01.FR.12');
    } else if (localAuthList.length > maxLocalAuthListEntries) {
      throw new Error(`Local auth list length (${localAuthList.length}) exceeds max local auth list entries (${maxLocalAuthListEntries})`);
    }

    const itemsPerMessageSendLocalList =
      await this.getItemsPerMessageSendLocalListByStationId(stationId)
      || localAuthList.length;

    return this.generateSendLocalListRequestsFromMaxLengthAndLocalAuthListAndStationId(itemsPerMessageSendLocalList, localAuthList, stationId);
  }

  async *generateSendLocalListRequestsFromMaxLengthAndLocalAuthListAndStationId(itemsPerMessageSendLocalList: number, localAuthList: Authorization[], stationId: string): AsyncGenerator<SendLocalListRequest> {
    let i = 0;
    let updateType = UpdateEnumType.Full;
    while (i < localAuthList.length) {
      const sendLocalListAuthList = localAuthList.slice(i, i + itemsPerMessageSendLocalList) as [Authorization, ...Authorization[]];
      const sendLocalList = await this._localAuthListRepository.createSendLocalList(stationId, i, updateType, sendLocalListAuthList);
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