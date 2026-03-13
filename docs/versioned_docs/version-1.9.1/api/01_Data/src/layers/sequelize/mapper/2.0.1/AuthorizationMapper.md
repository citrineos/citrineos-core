[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper

# 01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper

## Classes

### AuthorizationMapper

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L7)

#### Constructors

##### Constructor

```ts
new AuthorizationMapper(): AuthorizationMapper;
```

###### Returns

[`AuthorizationMapper`](#authorizationmapper)

#### Methods

##### fromAuthorizationStatusEnumType()

```ts
static fromAuthorizationStatusEnumType(status): AuthorizationStatusEnumType;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L64)

###### Parameters

| Parameter | Type                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`  | \| `"Accepted"` \| `"Blocked"` \| `"ConcurrentTx"` \| `"Expired"` \| `"Invalid"` \| `"NoCredit"` \| `"NotAllowedTypeEVSE"` \| `"NotAtThisLocation"` \| `"NotAtThisTime"` \| `"Unknown"` |

###### Returns

`AuthorizationStatusEnumType`

##### fromIdTokenEnumType()

```ts
static fromIdTokenEnumType(type):
  | "Central"
  | "eMAID"
  | "ISO14443"
  | "ISO15693"
  | "KeyCode"
  | "Local"
  | "MacAddress"
  | "NoAuthorization"
  | "Other";
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:146](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L146)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `type`    | `IdTokenEnumType` |

###### Returns

\| `"Central"`
\| `"eMAID"`
\| `"ISO14443"`
\| `"ISO15693"`
\| `"KeyCode"`
\| `"Local"`
\| `"MacAddress"`
\| `"NoAuthorization"`
\| `"Other"`

##### toAuthorizationData()

```ts
static toAuthorizationData(authorization): AuthorizationData;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L8)

###### Parameters

| Parameter       | Type                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| `authorization` | [`Authorization`](../../model/Authorization/Authorization.md#authorization) |

###### Returns

`AuthorizationData`

##### toAuthorizationStatusEnumType()

```ts
static toAuthorizationStatusEnumType(status):
  | "Accepted"
  | "Blocked"
  | "ConcurrentTx"
  | "Expired"
  | "Invalid"
  | "NoCredit"
  | "NotAllowedTypeEVSE"
  | "NotAtThisLocation"
  | "NotAtThisTime"
  | "Unknown";
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L93)

###### Parameters

| Parameter | Type                          |
| --------- | ----------------------------- |
| `status`  | `AuthorizationStatusEnumType` |

###### Returns

\| `"Accepted"`
\| `"Blocked"`
\| `"ConcurrentTx"`
\| `"Expired"`
\| `"Invalid"`
\| `"NoCredit"`
\| `"NotAllowedTypeEVSE"`
\| `"NotAtThisLocation"`
\| `"NotAtThisTime"`
\| `"Unknown"`

##### toIdToken()

```ts
static toIdToken(authorization): IdTokenType;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L16)

###### Parameters

| Parameter       | Type                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| `authorization` | [`Authorization`](../../model/Authorization/Authorization.md#authorization) |

###### Returns

`IdTokenType`

##### toIdTokenEnumType()

```ts
static toIdTokenEnumType(type): IdTokenEnumType;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L122)

###### Parameters

| Parameter | Type                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | \| `"Central"` \| `"eMAID"` \| `"ISO14443"` \| `"ISO15693"` \| `"KeyCode"` \| `"Local"` \| `"MacAddress"` \| `"NoAuthorization"` \| `"Other"` |

###### Returns

`IdTokenEnumType`

##### toIdTokenInfo()

```ts
static toIdTokenInfo(authorization): IdTokenInfoType;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L28)

###### Parameters

| Parameter       | Type                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| `authorization` | [`Authorization`](../../model/Authorization/Authorization.md#authorization) |

###### Returns

`IdTokenInfoType`

##### toMessageContentType()

```ts
static toMessageContentType(messageContent): MessageContentType;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L40)

###### Parameters

| Parameter        | Type  |
| ---------------- | ----- |
| `messageContent` | `any` |

###### Returns

`MessageContentType`

##### toMessageFormatEnum()

```ts
static toMessageFormatEnum(messageFormat): MessageFormatEnumType;
```

Defined in: [01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/2.0.1/AuthorizationMapper.ts#L49)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `messageFormat` | `string` |

###### Returns

`MessageFormatEnumType`
