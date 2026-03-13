[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/model/SecurityEvent

# 01_Data/src/layers/sequelize/model/SecurityEvent

## Classes

### SecurityEvent

Defined in: [01_Data/src/layers/sequelize/model/SecurityEvent.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L20)

#### Extends

- `Model`

#### Implements

- `SecurityEventDto`

#### Constructors

##### Constructor

```ts
new SecurityEvent(...args): SecurityEvent;
```

Defined in: [01_Data/src/layers/sequelize/model/SecurityEvent.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L66)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`SecurityEvent`](#securityevent)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                              | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value                                          | Description | Defined in                                                                                                                                                                                                  |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | `public`   | `CustomDataType` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `undefined`                                            | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L44) |
| <a id="stationid"></a> `stationId`    | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | Fields      | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L28) |
| <a id="techinfo"></a> `techInfo?`     | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                            | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L42) |
| <a id="tenant"></a> `tenant?`         | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L56) |
| `tenant.countryCode?`                 | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                               |
| `tenant.createdAt?`                   | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                              |
| `tenant.id?`                          | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                               |
| `tenant.isUserTenant`                 | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                              |
| `tenant.name`                         | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                               |
| `tenant.partyId?`                     | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                               |
| `tenant.serverProfileOCPI?`           | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                               |
| `tenant.updatedAt?`                   | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                              |
| `tenant.url?`                         | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                            | -           | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                               |
| <a id="tenantid"></a> `tenantId`      | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L53) |
| <a id="timestamp"></a> `timestamp`    | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L39) |
| <a id="type"></a> `type`              | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                            | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L31) |
| <a id="model_name"></a> `MODEL_NAME`  | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `OCPP2_0_1_Namespace.SecurityEventNotificationRequest` | -           | [01_Data/src/layers/sequelize/model/SecurityEvent.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L21) |

#### Methods

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/SecurityEvent.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/SecurityEvent.ts#L60)

###### Parameters

| Parameter  | Type                              |
| ---------- | --------------------------------- |
| `instance` | [`SecurityEvent`](#securityevent) |

###### Returns

`void`
