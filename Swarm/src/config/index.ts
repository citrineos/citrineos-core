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

import { EventGroup, SystemConfig } from "@citrineos/base";
import { createLocalConfig } from "./envs/local";
import { createProdConfig } from "./envs/prod";
import { createDockerConfig } from "./envs/docker";

export const systemConfig: SystemConfig = getConfig();

function getConfig() {
    switch (process.env.APP_ENV) {
        case "production":
            return createProdConfig();
        case "local":
            return createLocalConfig();
        case "docker":
            return createDockerConfig();
        default:
            throw new Error('Invalid APP_ENV "${process.env.APP_ENV}"');
    }
}

export const eventGroup: EventGroup = getGroup();

function getGroup(): EventGroup {
    if (process.env.APP_NAME && process.env.APP_NAME in EventGroup) {
        return process.env.APP_NAME as EventGroup;
    } else {
        throw new Error('Invalid APP_NAME "${process.env.APP_NAME}"');
    }
}