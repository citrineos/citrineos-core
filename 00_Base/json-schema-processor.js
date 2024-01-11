/* eslint-disable */

const fs = require('fs');
const jsts = require('json-schema-to-typescript');

if (process.argv.length === 2) {
    console.error('Expected input path argument!');
    process.exit(1);
}

const path = process.argv[2];
const globalEnums = new Set();
const globalDefinitions = {};
const globalEnumDefinitions = {};

const licenseComment = `/**
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
 * Copyright 2023 S44, LLC
 */
`;

fs.readdir(path, (error, files) => {

    const writeToFile = true;
    const promises = files.map(file => {
        let data = fs.readFileSync(`${path}/${file}`);
        return processJsonSchema(data, writeToFile);
    });

    Promise.all(promises).then(values => {

        values.forEach(({ definitions, enumDefinitions, enums }) => {

            Object.assign(globalDefinitions, definitions);

            if (enumDefinitions.length > 0) {
                enumDefinitions.forEach(entry => {
                    globalEnums.add(entry);
                });
            }

            if (enums.length > 0) {
                enums.forEach(entry => {
                    const { enumName, enumDocumentation, enumDefinition } = splitEnum(entry);
                    globalEnumDefinitions[enumName] = enumDefinition;
                });
            }
        });

        const exportStatements = [];
        const exportMap = {};

        // Export all enum types
        exportStatements.push(`export *  from './enums';`);

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
            exportStatements.push(`export { ${exportMap[key].join(", ")} } from './types/${key}';`);
            exportStatements.push(`export { default as ${key}Schema } from './schemas/${key}.json';`);
        }

        if (writeToFile) {
            fs.writeFileSync(`./src/ocpp/model/enums/index.ts`, Object.values(globalEnumDefinitions).sort().join("\n\n"));
            fs.writeFileSync(`./src/ocpp/model/index.ts`, exportStatements.join("\n"));
        }
    });
});

async function processJsonSchema(data, writeToFile = true) {
    let jsonSchema = JSON.parse(data);
    let id = jsonSchema["$id"].split(":").pop();
    jsonSchema["$id"] = id;
    delete jsonSchema["$schema"];

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
        jsts.compile(jsonSchema, id).then(ts => {
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
                enums.forEach(entry => {
                    ts = ts.replace(entry, "");
                });
            }

            // Collect all definitions
            const { definitions, enumDefinitions } = collectDefinitions(jsonSchema, id);

            // Add import statement for enums & schemaType
            if (enumDefinitions.length > 0) {
                const searchString = "\nexport";
                const index = ts.indexOf(searchString);
                ts = ts.substring(0, index) + 
                `\nimport { ${enumDefinitions.join(", ")} } from "../enums";\n` +
                `import { ${schemaType} } from "../../..";\n` 
                + ts.substring(index);
            }

            if (writeToFile) {
                fs.writeFileSync(`./src/ocpp/model/types/${id}.ts`, ts);
                fs.writeFileSync(`./src/ocpp/model/schemas/${id}.json`, JSON.stringify(jsonSchema, null, 2));
            }

            resolve({
                definitions,
                enumDefinitions,
                enums: (enums == null ? [] : enums)
            });
        });
    });
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
    for (const key in jsonSchema["definitions"]) {
        if (!key.includes("EnumType")) {
            definitions[key] = id;
        } else {
            enumDefinitions.push(key);
        }
    }
    return { definitions, enumDefinitions };
}

function processNode(node) {
    if (node["enum"]) {
        node["tsEnumNames"] = [...node["enum"]];
        node["tsEnumNames"] = node["tsEnumNames"].map(name => {
            return name.replaceAll(".", "_").replaceAll("-", "_");
        });
    } else {
        for (let key in node) {
            if (typeof node[key] === "object") {
                processNode(node[key]);
            }
        }
    }
}

function extractEnums(ts) {
    const pattern = /^\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\/\nexport const enum (\w)* {(\n|\s|\w|-|\.|=|"|,)*}/gm;
    const undocumentedPattern = /^export const enum (\w)* {(\n|\s|\w|-|\.|=|"|,)*}/gm;
    const matches = ts.match(pattern);
    let undocumentedMatches = ts.match(undocumentedPattern);

    if (matches && undocumentedMatches) {
        const namePattern = /export const enum (\w)*/g;
        matches.forEach(match => {
            const enumName = (match.match(namePattern)[0]).replace("export const enum ", "");
            undocumentedMatches = undocumentedMatches.filter(undocumentedMatch => !undocumentedMatch.includes(enumName));
        });
    }

    return [...(matches ? matches : []), ...(undocumentedMatches ? undocumentedMatches : [])];
}

function splitEnum(enumDefinition) {
    const commentPattern = /^\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\/\n/gm;
    const namePattern = /export const enum (\w)*/g;
    const enumName = (enumDefinition.match(namePattern)[0]).replace("export const enum ", "");
    let enumDocumentation = enumDefinition.match(commentPattern);
    enumDocumentation = enumDocumentation ? enumDocumentation[0] : "";
    return { enumName, enumDocumentation, enumDefinition };
}