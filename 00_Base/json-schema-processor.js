// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */

/**
 * execution:
 * - cd 00_Base
 * - node json-schema-processor.js -- version [1.6|2.0.1|2.1*]. Leave off version param to use latest.
 */

import { OCPP_SCHEMA_PROCESS_VERSION } from './process/types.js';
import { process_1_6 } from './process/json-schema-extension-1.6.js';
import { process_2 } from './process/json-schema-extension-2.js';

const version =
  process.argv.length == 2 ? OCPP_SCHEMA_PROCESS_VERSION.LATEST : parse_version(process.argv[2]);
console.log(`Finding process handler for OCPP version ${version}...`);

const handlers = [new process_1_6(), new process_2(version)];
const handler = handlers.find((handler) => handler.canHandle(version));

if (!handler) {
  console.error(`No handler found for OCPP version ${version}. Exiting.`);
  process.exit(1);
}

console.log(`Processing OCPP schemas using handler for version ${handler.version}...`);
await handler.processJsonAsync();
console.log('Processing complete.');

if (handler.writeToFile) console.log('Writing model files...');

function parse_version(user_version) {
  if (/^1\.6/.test(user_version)) return OCPP_SCHEMA_PROCESS_VERSION.OCPP_1_6;
  if (/^2\.0\.1/.test(user_version)) return OCPP_SCHEMA_PROCESS_VERSION.OCPP_2_0_1;
  if (/^2\.1/.test(user_version)) return OCPP_SCHEMA_PROCESS_VERSION.OCPP_2_1;

  //Only enter on match failure
  const keys = Object.keys(OCPP_SCHEMA_PROCESS_VERSION);

  const valid_versions = keys
    .filter((key) => key !== 'LATEST')
    .map((key) => OCPP_SCHEMA_PROCESS_VERSION[key]);

  console.log(
    `User version ${user_version} is not valid. Valid versions are: ${valid_versions.join(', ')}.`,
  );

  return OCPP_SCHEMA_PROCESS_VERSION.LATEST;
}
