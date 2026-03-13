[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/model/Location/LatestStatusNotification

# 01_Data/src/layers/sequelize/model/Location/LatestStatusNotification

## Classes

### LatestStatusNotification

Defined in: [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L25)

#### Extends

- `Model`

#### Implements

- `LatestStatusNotificationDto`

#### Constructors

##### Constructor

```ts
new LatestStatusNotification(...args): LatestStatusNotification;
```

Defined in: [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L60)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`LatestStatusNotification`](#lateststatusnotification)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                                                 | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value                                  | Defined in                                                                                                                                                                                                                                          |
| -------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingstation"></a> `chargingStation`           | `public`   | [`ChargingStation`](ChargingStation.md#chargingstation)                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `undefined`                                    | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L32) |
| <a id="stationid"></a> `stationId`                       | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                    | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L29) |
| <a id="statusnotification"></a> `statusNotification`     | `public`   | [`StatusNotification`](StatusNotification.md#statusnotification)                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`                                    | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L38) |
| <a id="statusnotificationid"></a> `statusNotificationId` | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                    | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L35) |
| <a id="tenant"></a> `tenant?`                            | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                    | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L50) |
| `tenant.countryCode?`                                    | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                                                       |
| `tenant.createdAt?`                                      | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                                                      |
| `tenant.id?`                                             | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                                                       |
| `tenant.isUserTenant`                                    | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                                                      |
| `tenant.name`                                            | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                                                       |
| `tenant.partyId?`                                        | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                                                       |
| `tenant.serverProfileOCPI?`                              | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                                                       |
| `tenant.updatedAt?`                                      | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                                                      |
| `tenant.url?`                                            | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                    | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                                                       |
| <a id="tenantid"></a> `tenantId`                         | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                    | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L47) |
| <a id="model_name"></a> `MODEL_NAME`                     | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `OCPP2_0_1_Namespace.LatestStatusNotification` | [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L26) |

#### Methods

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Location/LatestStatusNotification.ts#L54)

###### Parameters

| Parameter  | Type                                                    |
| ---------- | ------------------------------------------------------- |
| `instance` | [`LatestStatusNotification`](#lateststatusnotification) |

###### Returns

`void`
