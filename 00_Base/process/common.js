import * as fs from 'fs';
import * as jsts from 'json-schema-to-typescript';
import * as prettier from 'prettier';
import { exec } from 'child_process';

export const processNode = (node) => {
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
};

export const extractEnums = (ts) => {
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
};

export const splitEnum = (enumDefinition) => {
  const commentPattern = /^\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\/\n/gm;
  const namePattern = /export enum (\w)*/g;
  const enumName = enumDefinition.match(namePattern)[0].replace('export enum ', '');
  let enumDocumentation = enumDefinition.match(commentPattern);
  enumDocumentation = enumDocumentation ? enumDocumentation[0] : '';
  return { enumName, enumDocumentation, enumDefinition };
};

export const writeEnumsAndExportsPrettify = (version, enumDefinitions, exportStatements) => {
  fs.writeFileSync(
    `./src/ocpp/model/${version}/enums/index.ts`,
    LICENSE_STRING + Object.values(enumDefinitions).sort().join('\n\n') + '\n',
  );

  fs.writeFileSync(
    `./src/ocpp/model/${version}/index.ts`,
    LICENSE_STRING + exportStatements.join('\n') + '\n',
  );

  exec(
    `prettier --write ./src/ocpp/model/${version}/**/* && npx eslint --fix ./src/ocpp/model/${version}`,
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
};

export const writeTypesAndSchemas = async (version, id, typescriptString, jsonSchema) => {
  fs.writeFileSync(
    `./src/ocpp/model/${version}/types/${id}.ts`,
    typescriptString.replace(/\n+$/, '\n'),
  );

  // Format JSON with Prettier
  const formattedJson = await prettier.format(JSON.stringify(jsonSchema, null, 2), {
    parser: 'json',
  });
  fs.writeFileSync(`./src/ocpp/model/${version}/schemas/${id}.json`, formattedJson);
};

export const createTypescriptString = async (jsonSchema, id, elements) => {
  // Determine if the schema is a request or response
  let schemaType = '';
  if (id.toLowerCase().includes('request')) {
    schemaType = 'OcppRequest';
  } else if (id.toLowerCase().includes('response')) {
    schemaType = 'OcppResponse';
  }

  let typescriptString = await jsts.compile(jsonSchema, id, {
    style: { singleQuote: true, trailingComma: 'all' },
    format: true,
    enableConstEnums: false,
  });

  // Add licence comment
  typescriptString = LICENSE_STRING + typescriptString;

  // Extend the generated interface with Request or Response
  if (schemaType) {
    const interfaceNamePattern = new RegExp(`export interface ${id}`, 'g');
    typescriptString = typescriptString.replace(
      interfaceNamePattern,
      `export interface ${id} extends ${schemaType}`,
    );
  }

  // Extract enums
  const enums = extractEnums(typescriptString);
  if (enums) {
    for (let i = 0; i < enums.length; i++) {
      const entry = enums[i];
      typescriptString = typescriptString.replace(entry, '');
      enums[i] = entry.trimEnd();
    }
  }

  // Add import statement for enums & schemaType
  const index = typescriptString.indexOf('\nexport');

  typescriptString =
    typescriptString.substring(0, index) +
    (elements.length > 0
      ? `\nimport { ${elements.join(', ')} } from '../enums/index.js';\n`
      : '\n') +
    `import type { ${schemaType} } from '../../../../index.js'\n` +
    typescriptString.substring(index);

  // Add null type to all optional properties
  // This regex means a string starts with '?:' and ends with ';'
  const regex = /(\?:[^;]*);/g;
  typescriptString = typescriptString.replaceAll(regex, '$1 | null;');

  return { typescriptString, enums };
};

export const LICENSE_STRING = `// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

    `;
