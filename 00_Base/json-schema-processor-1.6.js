// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable */

/**
 * execution:
 * - cd 00_Base
 * - node json-schema-processor-1.6.js ../../OCPP-1.6/schemas/json
 */
const fs = require('fs');
const jsts = require('json-schema-to-typescript');
const prettier = require('prettier');
const { exec } = require('child_process');

if (process.argv.length === 2) {
  console.error('Expected input version and path arguments!');
  process.exit(1);
}

const path = process.argv[2];
const globalEnums = new Set();
const globalDefinitions = [];
const globalEnumDefinitions = {};

const licenseComment = `// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

`;

fs.readdir(path, (error, files) => {
  const writeToFile = true;
  const promises = files.map((file) => {
    let data = fs.readFileSync(`${path}/${file}`);
    return processJsonSchema(data, writeToFile);
  });

  Promise.all(promises).then((values) => {
    values.forEach(({ title, enumNames, enums }) => {
      globalDefinitions.push(title);

      if (enumNames.length > 0) {
        enumNames.forEach((entry) => {
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
          globalEnumDefinitions[title + enumName] = enumDefinition;
        });
      }
    });

    const exportStatements = [];

    // Export all enum types
    exportStatements.push(`export * from './enums';`);

    // Export all definitions and schemas
    for (let key of globalDefinitions) {
      exportStatements.push(`export { ${key} } from './types/${key}';`);
      exportStatements.push(`export { default as ${key}Schema } from './schemas/${key}.json';`);
    }

    if (writeToFile) {
      fs.writeFileSync(
        `./src/ocpp/model/1.6/enums/index.ts`,
        licenseComment + Object.values(globalEnumDefinitions).sort().join('\n\n') + '\n',
      );
      fs.writeFileSync(
        `./src/ocpp/model/1.6/index.ts`,
        licenseComment + exportStatements.join('\n') + '\n',
      );
      exec(
        `prettier --write ./src/ocpp/model/1.6/**/* && npx eslint --fix ./src/ocpp/model/1.6`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing npm script: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        },
      );
    }
  });
});

async function processJsonSchema(data, writeToFile = true) {
  let jsonSchema = JSON.parse(data);
  let id = jsonSchema['id'].split(':').pop();
  jsonSchema['$id'] = id;
  delete jsonSchema['id'];
  delete jsonSchema['$schema'];
  const title = jsonSchema['title'];

  // Correct & collect all enum names
  jsonSchema['definitions'] = {};
  const uniqueEnumNames = processEnumNames(
    jsonSchema['definitions'],
    jsonSchema['properties'],
    [],
    title,
  );

  // Preprocess nodes to enable enum extraction
  processNode(jsonSchema);

  // Determine if the schema is a request or response
  let schemaType = '';
  if (id.toLowerCase().includes('request')) {
    schemaType = 'OcppRequest';
  } else if (id.toLowerCase().includes('response')) {
    schemaType = 'OcppResponse';
  }

  return new Promise((resolve, reject) => {
    jsts
      .compile(jsonSchema, id, {
        style: { singleQuote: true, trailingComma: 'all' },
        format: true,
        enableConstEnums: false,
      })
      .then((ts) => {
        // Add licence comment
        ts = licenseComment + ts;

        // Extend the generated interface with Request or Response
        if (schemaType) {
          const interfaceNamePattern = new RegExp(`export interface ${id}`, 'g');
          ts = ts.replace(interfaceNamePattern, `export interface ${id} extends ${schemaType}`);
        }

        // Extract enums
        const enums = extractEnums(ts);
        if (enums) {
          for (let i = 0; i < enums.length; i++) {
            const entry = enums[i];
            ts = ts.replace(entry, '');
            enums[i] = entry.trimEnd();
          }
        }

        // Add import statement for enums & schemaType
        const searchString = '\nexport';
        const index = ts.indexOf(searchString);
        ts =
          ts.substring(0, index) +
          (uniqueEnumNames.length > 0
            ? `\nimport { ${uniqueEnumNames.join(', ')} } from '../enums';\n`
            : '\n') +
          `import { ${schemaType} } from '../../../..';\n` +
          ts.substring(index);

        // Add null type to all optional properties
        // This regex means a string starts with '?:' and ends with ';'
        const regex = /(\?:[^;]*);/g;
        ts = ts.replaceAll(regex, '$1 | null;');

        if (writeToFile) {
          fs.writeFileSync(`./src/ocpp/model/1.6/types/${id}.ts`, ts.replace(/\n+$/, '\n'));

          // Format JSON with Prettier
          prettier
            .format(JSON.stringify(jsonSchema, null, 2), { parser: 'json' })
            .then((formattedJson) => {
              fs.writeFileSync(`./src/ocpp/model/1.6/schemas/${id}.json`, formattedJson);
            });
        }

        resolve({
          title,
          enumNames: uniqueEnumNames,
          enums: enums == null ? [] : enums,
        });
      });
  });
}

function processEnumNames(definitionsRoot, node, uniqueEnumNames, title) {
  for (let key in node) {
    if (typeof node[key] === 'object') {
      if (node[key]['enum']) {
        uniqueKey = title + key.charAt(0).toUpperCase() + key.slice(1);
        definitionsRoot[uniqueKey] = node[key];
        node[key] = { $ref: `#/definitions/${uniqueKey}` };
        uniqueEnumNames.push(uniqueKey);
      } else {
        uniqueEnumNames = processEnumNames(definitionsRoot, node[key], uniqueEnumNames, title);
      }
    }
  }
  return uniqueEnumNames;
}

function processNode(node) {
  if (node['enum']) {
    node['tsEnumNames'] = [...node['enum']];
    node['tsEnumNames'] = node['tsEnumNames'].map((name) => {
      return name.replaceAll('.', '_').replaceAll('-', '_');
    });
  } else {
    for (let key in node) {
      if (typeof node[key] === 'object') {
        processNode(node[key]);
      }
    }
  }
}

function extractEnums(ts) {
  const pattern =
    /^\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\/\nexport enum (\w)* {(\s|\w|-|\.|=|'|,)*}\n*/gm;
  const undocumentedPattern = /^export enum (\w)* {(\s|\w|-|\.|=|'|,)*}\n*/gm;
  const matches = ts.match(pattern);
  let undocumentedMatches = ts.match(undocumentedPattern);

  if (matches && undocumentedMatches) {
    const namePattern = /export enum (\w)*/g;
    matches.forEach((match) => {
      const enumName = match.match(namePattern)[0].replace('export enum ', '');
      undocumentedMatches = undocumentedMatches.filter(
        (undocumentedMatch) => !undocumentedMatch.includes(enumName),
      );
    });
  }

  return [...(matches ? matches : []), ...(undocumentedMatches ? undocumentedMatches : [])];
}

function splitEnum(enumDefinition) {
  const commentPattern = /^\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\/\n/gm;
  const namePattern = /export enum (\w)*/g;
  const enumName = enumDefinition.match(namePattern)[0].replace('export enum ', '');
  let enumDocumentation = enumDefinition.match(commentPattern);
  enumDocumentation = enumDocumentation ? enumDocumentation[0] : '';
  return { enumName, enumDocumentation, enumDefinition };
}
