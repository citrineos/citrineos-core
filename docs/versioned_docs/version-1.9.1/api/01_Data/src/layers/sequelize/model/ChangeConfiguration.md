[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/model/ChangeConfiguration

# 01_Data/src/layers/sequelize/model/ChangeConfiguration

## Classes

### ChangeConfiguration

Defined in: [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L19)

#### Extends

- `Model`

#### Implements

- `ChangeConfigurationDto`

#### Constructors

##### Constructor

```ts
new ChangeConfiguration(...args): ChangeConfiguration;
```

Defined in: [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L62)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`ChangeConfiguration`](#changeconfiguration)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                             | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value                           | Defined in                                                                                                                                                                                                              |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="key"></a> `key`               | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                             | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L34) |
| <a id="readonly"></a> `readonly?`    | `public`   | `boolean` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `undefined`                             | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L40) |
| <a id="stationid"></a> `stationId`   | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                             | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L27) |
| <a id="tenant"></a> `tenant?`        | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                             | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L52) |
| `tenant.countryCode?`                | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                           |
| `tenant.createdAt?`                  | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                          |
| `tenant.id?`                         | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                           |
| `tenant.isUserTenant`                | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                          |
| `tenant.name`                        | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                           |
| `tenant.partyId?`                    | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                           |
| `tenant.serverProfileOCPI?`          | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                           |
| `tenant.updatedAt?`                  | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                          |
| `tenant.url?`                        | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                             | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                           |
| <a id="tenantid"></a> `tenantId`     | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                             | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L49) |
| <a id="value"></a> `value?`          | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                             | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L37) |
| <a id="model_name"></a> `MODEL_NAME` | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `OCPP1_6_Namespace.ChangeConfiguration` | [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L20) |

#### Methods

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/ChangeConfiguration.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChangeConfiguration.ts#L56)

###### Parameters

| Parameter  | Type                                          |
| ---------- | --------------------------------------------- |
| `instance` | [`ChangeConfiguration`](#changeconfiguration) |

###### Returns

`void`
