[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable

# 01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable

## Classes

### ComponentVariable

Defined in: [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L22)

#### Extends

- `Model`

#### Constructors

##### Constructor

```ts
new ComponentVariable(...args): ComponentVariable;
```

Defined in: [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L54)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`ComponentVariable`](#componentvariable)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                               | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value         | Defined in                                                                                                                                                                                                                                  |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="componentid"></a> `componentId` | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`           | [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L28) |
| <a id="tenant"></a> `tenant?`          | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`           | [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L44) |
| `tenant.countryCode?`                  | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                                               |
| `tenant.createdAt?`                    | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                                              |
| `tenant.id?`                           | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                                               |
| `tenant.isUserTenant`                  | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                                              |
| `tenant.name`                          | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                                               |
| `tenant.partyId?`                      | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                                               |
| `tenant.serverProfileOCPI?`            | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                                               |
| `tenant.updatedAt?`                    | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                                              |
| `tenant.url?`                          | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                                               |
| <a id="tenantid"></a> `tenantId`       | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`           | [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L41) |
| <a id="variableid"></a> `variableId`   | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`           | [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L32) |
| <a id="model_name"></a> `MODEL_NAME`   | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `'ComponentVariable'` | [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L24) |

#### Methods

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/DeviceModel/ComponentVariable.ts#L48)

###### Parameters

| Parameter  | Type                                      |
| ---------- | ----------------------------------------- |
| `instance` | [`ComponentVariable`](#componentvariable) |

###### Returns

`void`
