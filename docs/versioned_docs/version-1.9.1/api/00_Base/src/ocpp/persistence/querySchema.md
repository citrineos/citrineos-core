[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/ocpp/persistence/querySchema

# 00_Base/src/ocpp/persistence/querySchema

## Interfaces

### QuerySchemaProperties

Defined in: [00_Base/src/ocpp/persistence/querySchema.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L4)

#### Properties

| Property                                  | Type      | Defined in                                                                                                                                                                                |
| ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="defaultvalue"></a> `defaultValue?` | `string`  | [00_Base/src/ocpp/persistence/querySchema.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L7) |
| <a id="key"></a> `key`                    | `string`  | [00_Base/src/ocpp/persistence/querySchema.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L5) |
| <a id="pattern"></a> `pattern?`           | `string`  | [00_Base/src/ocpp/persistence/querySchema.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L9) |
| <a id="required"></a> `required?`         | `boolean` | [00_Base/src/ocpp/persistence/querySchema.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L8) |
| <a id="type"></a> `type`                  | `string`  | [00_Base/src/ocpp/persistence/querySchema.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L6) |

## Variables

### MessageConfirmationSchema

```ts
const MessageConfirmationSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/querySchema.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L56)

## Functions

### QuerySchema()

```ts
function QuerySchema(name, properties): object;
```

Defined in: [00_Base/src/ocpp/persistence/querySchema.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/querySchema.ts#L18)

Utility function for creating querystring schemas for fastify route definitions

#### Parameters

| Parameter    | Type                                                | Description                                                                                                                           |
| ------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `name`       | `string`                                            | The name of the schema                                                                                                                |
| `properties` | [`QuerySchemaProperties`](#queryschemaproperties)[] | An array of objects each representing a unique property. Properties with types ending in '[]' will be treated as arrays of that type. |

#### Returns

`object`
