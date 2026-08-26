// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IFileStorage } from '@citrineos/base';
import type { WebsocketServerConfig } from '@citrineos/types';
import { websocketServersConfigSchema } from '@citrineos/types';

/**
 * Reads and validates the websocket servers this pod hosts
 *
 * @param fileStorage Storage the file is read through; keys resolve against its root.
 * @param fileName `SystemConfig.websocketServerConfigFile`.
 * @throws If the file is missing or fails schema validation.
 */
export async function loadWebsocketServersConfig(
  fileStorage: IFileStorage,
  fileName: string,
): Promise<WebsocketServerConfig[]> {
  const configString = await fileStorage.getFile(fileName);
  if (!configString) {
    throw new Error(`Websocket servers config file not found: ${fileName}`);
  }
  return websocketServersConfigSchema.parse(JSON.parse(configString));
}
