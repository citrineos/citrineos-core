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

import { HttpMethod } from ".";
import { Namespace } from "../..";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsDataEndpoint } from "./AsDataEndpoint";

/**
 * Interface for usage in {@link AsDataEndpoint} decorator.
 */
export interface IDataEndpointDefinition {
    // eslint-disable-next-line @typescript-eslint/ban-types
    method: Function;
    methodName: string;
    namespace: Namespace;
    httpMethod: HttpMethod;
    querySchema?: object;
    bodySchema?: object;
}