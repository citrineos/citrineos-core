[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/model/BaseModelWithTenant

# 01_Data/src/layers/sequelize/model/BaseModelWithTenant

## Classes

### `abstract` BaseModelWithTenant

Defined in: [01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts#L18)

#### Extends

- `Model`\<`TModelAttributes`, `TCreationAttributes`\>

#### Type Parameters

| Type Parameter                           | Default type       |
| ---------------------------------------- | ------------------ |
| `TModelAttributes` _extends_ `object`    | `any`              |
| `TCreationAttributes` _extends_ `object` | `TModelAttributes` |

#### Constructors

##### Constructor

```ts
new BaseModelWithTenant<TModelAttributes, TCreationAttributes>(...args): BaseModelWithTenant<TModelAttributes, TCreationAttributes>;
```

Defined in: [01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts#L42)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`BaseModelWithTenant`](#abstract-basemodelwithtenant)\<`TModelAttributes`, `TCreationAttributes`\>

###### Overrides

```ts
Model<TModelAttributes, TCreationAttributes>.constructor
```

#### Properties

| Property                         | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Defined in                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="tenant"></a> `tenant?`    | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts#L32) |
| `tenant.countryCode?`            | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                           |
| `tenant.createdAt?`              | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                          |
| `tenant.id?`                     | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                           |
| `tenant.isUserTenant`            | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                          |
| `tenant.name`                    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                           |
| `tenant.partyId?`                | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                           |
| `tenant.serverProfileOCPI?`      | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                           |
| `tenant.updatedAt?`              | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                          |
| `tenant.url?`                    | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                           |
| <a id="tenantid"></a> `tenantId` | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts#L29) |

#### Methods

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/BaseModelWithTenant.ts#L36)

###### Parameters

| Parameter  | Type                                                   |
| ---------- | ------------------------------------------------------ |
| `instance` | [`BaseModelWithTenant`](#abstract-basemodelwithtenant) |

###### Returns

`void`
