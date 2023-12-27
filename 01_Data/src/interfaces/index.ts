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

export * from './repositories';

// Data endpoints query models
export { ChargingStationKeyQuerystring, ChargingStationKeyQuerySchema } from "./queries/ChargingStation";
export { VariableAttributeQuerystring, VariableAttributeQuerySchema, CreateOrUpdateVariableAttributeQuerystring, CreateOrUpdateVariableAttributeQuerySchema } from "./queries/VariableAttribute";
export { AuthorizationQuerystring, AuthorizationQuerySchema } from "./queries/Authorization";
export { TransactionEventQuerystring, TransactionEventQuerySchema } from "./queries/TransactionEvent";

// Data projection models
export { AuthorizationRestrictions } from "./projections/AuthorizationRestrictions";
export { default as AuthorizationRestrictionsSchema } from './projections/schemas/AuthorizationRestrictionsSchema.json'