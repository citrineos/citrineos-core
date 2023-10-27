/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { SetVariableDataType, ICrudRepository, SetVariableResultType, AuthorizationData, TransactionEventRequest, ChargingStateEnumType, IdTokenType, VariableAttributeType, ReportDataType, BootConfig, RegistrationStatusEnumType, StatusInfoType, GetVariableResultType } from "@citrineos/base";
import { AuthorizationQuerystring } from "./queries/Authorization";
import { Transaction } from "../layers/sequelize/model/TransactionEvent";
import { VariableAttribute } from "../layers/sequelize/model/DeviceModel/VariableAttribute";
import { AuthorizationRestrictions, VariableAttributeQuerystring } from ".";
import { Boot, Authorization } from "../layers/sequelize";

export interface IDeviceModelRepository extends ICrudRepository<VariableAttributeType> {
    createOrUpdateDeviceModelByStationId(value: ReportDataType, stationId: string, status?: string, statusInfo?: StatusInfoType): Promise<VariableAttribute[]>;
    createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: GetVariableResultType[], stationId: string): Promise<VariableAttribute[]>;
    createOrUpdateBySetVariablesDataAndStationId(setVariablesData: SetVariableDataType[], stationId: string): Promise<VariableAttribute[]>;
    updateResultByStationId(result: SetVariableResultType, stationId: string): Promise<VariableAttribute | undefined>;
    readAllSetVariableByStationId(stationId: string): Promise<SetVariableDataType[]>;
    readAllByQuery(query: VariableAttributeQuerystring): Promise<VariableAttribute[]>;
    existsRejectedSetVariableByStationId(stationId: string): Promise<boolean>;
    existsByQuery(query: VariableAttributeQuerystring): Promise<boolean>;
    deleteAllByQuery(query: VariableAttributeQuerystring): Promise<number>;
}

/**
 * Key is StationId
 */
export interface IBootRepository extends ICrudRepository<BootConfig> {
    createOrUpdateByKey(value: BootConfig, key: string): Promise<Boot | undefined>;
    updateStatusByKey(status: RegistrationStatusEnumType, statusInfo: StatusInfoType | undefined, key: string): Promise<Boot | undefined>;
    updateLastBootTimeByKey(lastBootTime: string, key: string): Promise<Boot | undefined>;
    readByKey(key: string): Promise<Boot | undefined>;
    existsByKey(key: string): Promise<boolean>;
    deleteByKey(key: string): Promise<boolean>;
}

export interface IAuthorizationRepository extends ICrudRepository<AuthorizationData> {
    createOrUpdateByQuery(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined>;
    updateRestrictionsByQuery(value: AuthorizationRestrictions, query: AuthorizationQuerystring): Promise<Authorization | undefined>;
    readByQuery(query: AuthorizationQuerystring): Promise<Authorization | undefined>;
    existsByQuery(query: AuthorizationQuerystring): Promise<boolean>;
    deleteAllByQuery(query: AuthorizationQuerystring): Promise<number>;
}

export interface ITransactionEventRepository extends ICrudRepository<TransactionEventRequest> {
    createByStationId(value: TransactionEventRequest, stationId: string): Promise<TransactionEventRequest | undefined>;
    readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEventRequest[]>;
    readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined>;
    readAllTransactionsByStationIdAndChargingStates(stationId: string, chargingStates?: ChargingStateEnumType[]): Promise<Transaction[]>;
    readAllActiveTransactionByIdToken(idToken: IdTokenType): Promise<Transaction[]>;
}