[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 01_Data/src/interfaces/queries/VariableAttribute

# 01_Data/src/interfaces/queries/VariableAttribute

## Interfaces

### CreateOrUpdateVariableAttributeQuerystring

Defined in: [01_Data/src/interfaces/queries/VariableAttribute.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L71)

#### Properties

| Property                                  | Type      | Defined in                                                                                                                                                                                                  |
| ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="setoncharger"></a> `setOnCharger?` | `boolean` | [01_Data/src/interfaces/queries/VariableAttribute.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L74) |
| <a id="stationid"></a> `stationId`        | `string`  | [01_Data/src/interfaces/queries/VariableAttribute.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L73) |
| <a id="tenantid"></a> `tenantId`          | `number`  | [01_Data/src/interfaces/queries/VariableAttribute.ts:72](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L72) |

---

### VariableAttributeQuerystring

Defined in: [01_Data/src/interfaces/queries/VariableAttribute.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L7)

#### Properties

| Property                                                              | Type                        | Defined in                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="component_evse_connectorid"></a> `component_evse_connectorId?` | `number` \| `null`          | [01_Data/src/interfaces/queries/VariableAttribute.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L14) |
| <a id="component_evse_id"></a> `component_evse_id?`                   | `number`                    | [01_Data/src/interfaces/queries/VariableAttribute.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L13) |
| <a id="component_instance"></a> `component_instance?`                 | `string` \| `null`          | [01_Data/src/interfaces/queries/VariableAttribute.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L16) |
| <a id="component_name"></a> `component_name?`                         | `string`                    | [01_Data/src/interfaces/queries/VariableAttribute.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L15) |
| <a id="stationid-1"></a> `stationId`                                  | `string`                    | [01_Data/src/interfaces/queries/VariableAttribute.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L8)   |
| <a id="status"></a> `status?`                                         | `SetVariableStatusEnumType` | [01_Data/src/interfaces/queries/VariableAttribute.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L12) |
| <a id="tenantid-1"></a> `tenantId`                                    | `number`                    | [01_Data/src/interfaces/queries/VariableAttribute.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L9)   |
| <a id="type"></a> `type?`                                             | `AttributeEnumType`         | [01_Data/src/interfaces/queries/VariableAttribute.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L10) |
| <a id="value"></a> `value?`                                           | `string`                    | [01_Data/src/interfaces/queries/VariableAttribute.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L11) |
| <a id="variable_instance"></a> `variable_instance?`                   | `string` \| `null`          | [01_Data/src/interfaces/queries/VariableAttribute.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L18) |
| <a id="variable_name"></a> `variable_name?`                           | `string`                    | [01_Data/src/interfaces/queries/VariableAttribute.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L17) |

## Variables

### CreateOrUpdateVariableAttributeQuerySchema

```ts
const CreateOrUpdateVariableAttributeQuerySchema: object;
```

Defined in: [01_Data/src/interfaces/queries/VariableAttribute.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L77)

---

### VariableAttributeQuerySchema

```ts
const VariableAttributeQuerySchema: object;
```

Defined in: [01_Data/src/interfaces/queries/VariableAttribute.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/queries/VariableAttribute.ts#L21)
