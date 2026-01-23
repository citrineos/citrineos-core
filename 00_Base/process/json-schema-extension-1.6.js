// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  processNode,
  splitEnum,
  createTypescriptString,
  writeEnumsAndExportsPrettify,
  writeTypesAndSchemas,
} from './common.js';
import { OCPP_SCHEMA_PROCESS_VERSION } from './types.js';
import * as fs from 'fs';

//This processor class is specific to OCPP 1.6
const path = './src/ocpp/model/1.6/schemas';
export class process_1_6 {
  version = OCPP_SCHEMA_PROCESS_VERSION.OCPP_1_6;
  writeToFile = true;
  canHandle = (version) => {
    return this.version === version;
  };
  processJsonAsync = async () => {
    const exportMap = new Map();
    const enumDefinitions = {};
    const dataFileNames = fs.readdirSync(path);
    const parsedData = [];

    for (const fileName of dataFileNames) {
      const file = fs.readFileSync(`${path}/${fileName}`);
      const parsed = await this.processJsonSchema(file);
      parsedData.push(parsed);

      if (fileName.toLowerCase() !== parsed.title.toLowerCase() + '.json') {
        // Remove files that have different names than the newly written file to avoid duplicates
        // EX: Authorize.json (to be removed) and AuthorizeRequest.json (to be kept)
        fs.unlinkSync(`${path}/${fileName}`);
      }
    }

    // Export all enum types
    exportMap.set('index', [`export * from './enums/index.js';`]);
    parsedData.forEach(({ title, enumNames, enums }) => {
      if (!exportMap.has(title)) {
        exportMap.set(title, [
          `export type { ${title} } from './types/${title}.js';`,
          `export { default as ${title}Schema } from './schemas/${title}.json' with { type: 'json' };`,
        ]);
      }

      if (enums.length > 0) {
        enums.forEach((entry) => {
          let { enumName, enumDocumentation, enumDefinition } = splitEnum(entry);
          if (enumName == 'DataEnumType') {
            // Adding missing type for DataEnumType... type in OCPP 2.0.1 appendix but not in part 3 JSON schemas
            let lastLineIndex = enumDefinition.lastIndexOf(`'`);
            enumDefinition =
              enumDefinition.substring(0, lastLineIndex) +
              `',\n  passwordString = 'passwordString` +
              enumDefinition.substring(lastLineIndex);
          }
          enumDefinitions[title + enumName] = enumDefinition;
        });
      }
    });

    const exports = [...exportMap.values()].flat();
    if (this.writeToFile) {
      writeEnumsAndExportsPrettify(this.version, enumDefinitions, exports);
    }
  };

  processJsonSchema = async (data) => {
    let jsonSchema = JSON.parse(data);
    if (jsonSchema['id']) {
      let idValue = jsonSchema['id'].split(':').pop();
      jsonSchema['$id'] = idValue;
      delete jsonSchema['id'];
      delete jsonSchema['$schema'];
    }

    let id = jsonSchema['$id'].split(':').pop();
    const title = jsonSchema['title'];

    // Correct & collect all enum names
    if (!jsonSchema['definitions']) {
      jsonSchema['definitions'] = {};
    }

    const uniqueEnumNames = processEnumNames(
      jsonSchema['definitions'],
      jsonSchema['properties'],
      [],
      title,
    );

    // Preprocess nodes to enable enum extraction
    processNode(jsonSchema);

    // Process typescript from schema
    const { typescriptString, enums } = await createTypescriptString(
      jsonSchema,
      id,
      uniqueEnumNames,
    );

    if (this.writeToFile) {
      writeTypesAndSchemas(this.version, id, typescriptString, jsonSchema);
    }

    return { title, enumNames: uniqueEnumNames, enums };
  };
}

const processEnumNames = (definitionsRoot, node, uniqueEnumNames, title) => {
  for (let key in node) {
    if (typeof node[key] !== 'object') continue;

    if (node[key]['$ref']) {
      const keyName = node[key]['$ref'].split('/').pop();
      if (definitionsRoot[keyName]) {
        uniqueEnumNames.push(keyName);
      }
      continue;
    }

    if (node[key]['enum']) {
      const uniqueKey = title + key.charAt(0).toUpperCase() + key.slice(1);
      definitionsRoot[uniqueKey] = node[key];
      node[key] = { $ref: `#/definitions/${uniqueKey}` };
      uniqueEnumNames.push(uniqueKey);
      continue;
    }

    uniqueEnumNames = processEnumNames(definitionsRoot, node[key], uniqueEnumNames, title);
  }

  return uniqueEnumNames;
};
