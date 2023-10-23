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

/**
 * The message querystring interface, used for every OCPP message endpoint to validate query parameters.
 */
export interface IMessageQuerystring {
    identifier: string;
    tenantId: string;
}

/**
 * This message querystring schema describes the {@link IMessageQuerystring} interface.
 */
export const IMessageQuerystringSchema = {
    type: 'object',
    properties: {
        identifier: { type: 'string' },
        tenantId: { type: 'string' }
    },
    required: ['identifier', 'tenantId']
}