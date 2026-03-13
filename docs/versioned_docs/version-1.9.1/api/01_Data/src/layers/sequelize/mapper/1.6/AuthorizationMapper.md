[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper

# 01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper

## Classes

### AuthorizationMapper

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper.ts#L8)

#### Constructors

##### Constructor

```ts
new AuthorizationMapper(): AuthorizationMapper;
```

###### Returns

[`AuthorizationMapper`](#authorizationmapper)

#### Methods

##### toIdTagInfoStatus()

```ts
static toIdTagInfoStatus(status): AuthorizeResponseStatus;
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper.ts#L9)

###### Parameters

| Parameter | Type                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`  | \| `"Accepted"` \| `"Blocked"` \| `"ConcurrentTx"` \| `"Expired"` \| `"Invalid"` \| `"NoCredit"` \| `"NotAllowedTypeEVSE"` \| `"NotAtThisLocation"` \| `"NotAtThisTime"` \| `"Unknown"` |

###### Returns

`AuthorizeResponseStatus`

##### toStartTransactionResponseStatus()

```ts
static toStartTransactionResponseStatus(status): StartTransactionResponseStatus;
```

Defined in: [01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/mapper/1.6/AuthorizationMapper.ts#L24)

###### Parameters

| Parameter | Type                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`  | \| `"Accepted"` \| `"Blocked"` \| `"ConcurrentTx"` \| `"Expired"` \| `"Invalid"` \| `"NoCredit"` \| `"NotAllowedTypeEVSE"` \| `"NotAtThisLocation"` \| `"NotAtThisTime"` \| `"Unknown"` |

###### Returns

`StartTransactionResponseStatus`
