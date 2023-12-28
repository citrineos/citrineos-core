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

import { ConnectorEnumType } from "@citrineos/base";

export interface AuthorizationRestrictions {
    /**
     * If present, connector types this authorization profile is permitted to charge at.
     * SHALL use options in {@link ConnectorEnumType} if applicable, plus "cGBT, cChaoJi,
     * OppCharge" as mentioned in information model, or a custom option if nothing else 
     * fits.
     */
    allowedConnectorTypes?: string[];

    /**
     * If present, this list will be used to prevent charging at evses which match one of
     * its strings. EvseId is as defined in Part 2 - Appendices of OCPP 2.0.1, which 
     * references the ISO 15118/IEC 63119-2 format. Strings in this list are treated as
     * prefixes for matching purposes to allow hierarchical id semantics to exclude entire
     * stations with one entry, i.e. "US\*A23\*E00235" will match "US\*A23\*E00235\*1" and 
     * "US\*A23\*E00235\*2", which could represent Evse 1 and 2 at the same station.
     */
    disallowedEvseIdPrefixes?: string[];
}