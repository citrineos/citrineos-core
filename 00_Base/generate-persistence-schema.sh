npx typescript-json-schema ./src/ocpp/model/types/${1}.ts $2 --required >> ./src/ocpp/persistence/schemas/${2}Schema.json
# TODO: Append to index.ts after generating the schema file