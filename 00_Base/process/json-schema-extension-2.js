import {
  processNode,
  splitEnum,
  writeTypesAndSchemas,
  writeEnumsAndExportsPrettify,
  createTypescriptString,
} from './common.js';
import { OCPP_SCHEMA_PROCESS_VERSION } from './types.js';
import * as fs from 'fs';

//This processor class currently handles all 2.x versions
//A new handler should be created if future 2.x versions diverge to a moderate degree
export class process_2 {
  constructor(version) {
    this.version = version;
    this.path = `./src/ocpp/model/${version}/schemas`;
  }
  versions = [OCPP_SCHEMA_PROCESS_VERSION.OCPP_2_0_1, OCPP_SCHEMA_PROCESS_VERSION.OCPP_2_1];
  writeToFile = true;
  canHandle = (version) => {
    return this.versions.includes(version);
  };
  processJsonAsync = async () => {
    const globalEnums = new Set();
    const globalDefinitions = {};
    const globalEnumDefinitions = {};
    const dataFileNames = fs.readdirSync(this.path);
    const parsedData = [];

    for (const fileName of dataFileNames) {
      const file = fs.readFileSync(`${this.path}/${fileName}`);
      const parsed = await this.processJsonSchema(file);
      parsedData.push(parsed);
    }

    parsedData.forEach(({ definitions, enumDefinitions, enums }) => {
      Object.assign(globalDefinitions, definitions);

      if (enumDefinitions.length > 0) {
        enumDefinitions.forEach((entry) => {
          globalEnums.add(entry);
        });
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
          globalEnumDefinitions[enumName] = enumDefinition;
        });
      }
    });

    const exportStatements = [];
    const exportMap = {};

    // Export all enum types
    exportStatements.push(`export * from './enums/index.js';`);

    // Prepare all definitions for export
    for (let key in globalDefinitions) {
      var definitionSource = globalDefinitions[key];
      if (!exportMap[definitionSource]) {
        exportMap[definitionSource] = [key];
      } else {
        exportMap[definitionSource].push(key);
      }
    }

    // Export all definitions and schemas
    for (let key in exportMap) {
      exportStatements.push(
        `export type { ${exportMap[key].join(', ')} } from './types/${key}.js';`,
      );
      exportStatements.push(
        `export { default as ${key}Schema } from './schemas/${key}.json' with { type: \'json\' };`,
      );
    }

    if (this.writeToFile) {
      writeEnumsAndExportsPrettify(this.version, globalEnumDefinitions, exportStatements);
    }
  };

  processJsonSchema = async (data) => {
    let jsonSchema = JSON.parse(data);
    let id = jsonSchema['$id'].split(':').pop();
    jsonSchema['$id'] = id;
    delete jsonSchema['$schema'];

    // Preprocess nodes to enable enum extraction
    processNode(jsonSchema);

    // Collect all definitions
    const { definitions, enumDefinitions } = collectDefinitions(jsonSchema, id);
    // Process typescript from schema
    const { typescriptString, enums } = await createTypescriptString(
      jsonSchema,
      id,
      enumDefinitions,
    );

    if (this.writeToFile) {
      writeTypesAndSchemas(this.version, id, typescriptString, jsonSchema);
    }

    return {
      definitions,
      enumDefinitions,
      enums: enums == null ? [] : enums,
    };
  };
}

function mapFromId(id) {
  const map = {};
  const idKey = `${id}`;
  map[idKey] = id;
  return map;
}

function collectDefinitions(jsonSchema, id) {
  const definitions = mapFromId(id);
  const enumDefinitions = [];
  for (const key in jsonSchema['definitions']) {
    if (!key.includes('EnumType')) {
      definitions[key] = id;
    } else {
      enumDefinitions.push(key);
    }
  }
  return { definitions, enumDefinitions };
}
