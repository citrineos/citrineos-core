[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo

# 01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo

## Classes

### ChargingStationSecurityInfo

Defined in: [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L22)

Represents the security information found on a particular charging station.

#### Extends

- `Model`

#### Implements

- `ChargingStationSecurityInfoDto`

#### Constructors

##### Constructor

```ts
new ChargingStationSecurityInfo(...args): ChargingStationSecurityInfo;
```

Defined in: [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L58)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`ChargingStationSecurityInfo`](#chargingstationsecurityinfo)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                                       | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value                                     | Defined in                                                                                                                                                                                                                              |
| ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="publickeyfileid"></a> `publicKeyFileId` | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                       | [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L36) |
| <a id="stationid"></a> `stationId`             | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                       | [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L29) |
| <a id="tenant"></a> `tenant?`                  | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                       | [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L48) |
| `tenant.countryCode?`                          | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                                           |
| `tenant.createdAt?`                            | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                                          |
| `tenant.id?`                                   | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                                           |
| `tenant.isUserTenant`                          | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                                          |
| `tenant.name`                                  | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                                           |
| `tenant.partyId?`                              | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                                           |
| `tenant.serverProfileOCPI?`                    | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                                           |
| `tenant.updatedAt?`                            | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                                          |
| `tenant.url?`                                  | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                                           |
| <a id="tenantid"></a> `tenantId`               | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                       | [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L45) |
| <a id="model_name"></a> `MODEL_NAME`           | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `OCPP2_0_1_Namespace.ChargingStationSecurityInfo` | [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L23) |

#### Methods

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/ChargingStationSecurityInfo.ts#L52)

###### Parameters

| Parameter  | Type                                                          |
| ---------- | ------------------------------------------------------------- |
| `instance` | [`ChargingStationSecurityInfo`](#chargingstationsecurityinfo) |

###### Returns

`void`
