[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/model/Tariff/Tariffs

# 01_Data/src/layers/sequelize/model/Tariff/Tariffs

## Classes

### Tariff

Defined in: [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L23)

#### Extends

- `Model`

#### Implements

- `TariffDto`

#### Constructors

##### Constructor

```ts
new Tariff(...args): Tariff;
```

Defined in: [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:145](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L145)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`Tariff`](#tariff)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                                                | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value                | Overrides                               | Defined in                                                                                                                                                                                                      |
| ------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="authorizationamount"></a> `authorizationAmount?` | `public`   | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L78)   |
| <a id="connectors"></a> `connectors?`                   | `public`   | [`Connector`](../Location/Connector.md#connector)[]                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L27)   |
| <a id="currency"></a> `currency`                        | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L33)   |
| <a id="id"></a> `id`                                    | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | `TariffDto.id` `Model.id`               | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L105) |
| <a id="paymentfee"></a> `paymentFee?`                   | `public`   | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L89)   |
| <a id="priceperkwh"></a> `pricePerKwh`                  | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L45)   |
| <a id="pricepermin"></a> `pricePerMin?`                 | `public`   | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L56)   |
| <a id="pricepersession"></a> `pricePerSession?`         | `public`   | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L67)   |
| <a id="tariffalttext"></a> `tariffAltText?`             | `public`   | `object`[] \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L103) |
| <a id="taxrate"></a> `taxRate?`                         | `public`   | `number` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L100) |
| <a id="tenant"></a> `tenant?`                           | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:135](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L135) |
| `tenant.countryCode?`                                   | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                   |
| `tenant.createdAt?`                                     | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                  |
| `tenant.id?`                                            | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                   |
| `tenant.isUserTenant`                                   | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                  |
| `tenant.name`                                           | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                   |
| `tenant.partyId?`                                       | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                   |
| `tenant.serverProfileOCPI?`                             | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                   |
| `tenant.updatedAt?`                                     | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                  |
| `tenant.url?`                                           | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                  | -                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                   |
| <a id="tenantid"></a> `tenantId`                        | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                  | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L132) |
| <a id="updatedat"></a> `updatedAt`                      | `public`   | `Date` & `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                  | `TariffDto.updatedAt` `Model.updatedAt` | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L106) |
| <a id="model_name"></a> `MODEL_NAME`                    | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `OCPP2_0_1_Namespace.Tariff` | -                                       | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L24)   |

#### Accessors

##### data

###### Get Signature

```ts
get data(): TariffData;
```

Defined in: [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L108)

###### Returns

[`TariffData`](#tariffdata-1)

#### Methods

##### newInstance()

```ts
static newInstance(data): Tariff;
```

Defined in: [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L121)

###### Parameters

| Parameter | Type                          |
| --------- | ----------------------------- |
| `data`    | [`TariffData`](#tariffdata-1) |

###### Returns

[`Tariff`](#tariff)

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L139)

###### Parameters

| Parameter  | Type                |
| ---------- | ------------------- |
| `instance` | [`Tariff`](#tariff) |

###### Returns

`void`

## Interfaces

### TariffData

Defined in: [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:153](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L153)

#### Properties

| Property                                                  | Type               | Defined in                                                                                                                                                                                                      |
| --------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="authorizationamount-1"></a> `authorizationAmount?` | `number` \| `null` | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:162](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L162) |
| <a id="currency-1"></a> `currency`                        | `string`           | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L155) |
| <a id="id-1"></a> `id`                                    | `number`           | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:154](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L154) |
| <a id="paymentfee-1"></a> `paymentFee?`                   | `number` \| `null` | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:163](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L163) |
| <a id="priceperkwh-1"></a> `pricePerKwh`                  | `number`           | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:157](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L157) |
| <a id="pricepermin-1"></a> `pricePerMin?`                 | `number` \| `null` | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:158](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L158) |
| <a id="pricepersession-1"></a> `pricePerSession?`         | `number` \| `null` | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:159](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L159) |
| <a id="taxrate-1"></a> `taxRate?`                         | `number` \| `null` | [01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts:160](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/Tariff/Tariffs.ts#L160) |
