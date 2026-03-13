[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/cache/types

# 00_Base/src/interfaces/cache/types

## Enumerations

### CacheNamespace

Defined in: [00_Base/src/interfaces/cache/types.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L10)

Cache namespace, used for grouping cache entries

#### Enumeration Members

##### CentralSystem

```ts
CentralSystem: 'csms';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L11)

##### ChargingStation

```ts
ChargingStation: 'cs';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L12)

##### Connections

```ts
Connections: 'conn';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L14)

##### Other

```ts
Other: 'other';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L16)

##### Protocol

```ts
Protocol: 'prtcl';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L15)

##### Transactions

```ts
Transactions: 'tx';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L13)

## Interfaces

### IWebsocketConnection

Defined in: [00_Base/src/interfaces/cache/types.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L39)

Used in the Connections Namespace as the value, to represent a websocket connection
Is stringified from JSON when stored in the cache

#### Properties

| Property                           | Type     | Defined in                                                                                                                                                                      |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="id"></a> `id`               | `string` | [00_Base/src/interfaces/cache/types.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L40) |
| <a id="protocol-1"></a> `protocol` | `string` | [00_Base/src/interfaces/cache/types.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L41) |

## Variables

### IDENTIFIER_DELIMITER

```ts
const IDENTIFIER_DELIMITER: ':' = ':';
```

Defined in: [00_Base/src/interfaces/cache/types.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L23)

## Functions

### createIdentifier()

```ts
function createIdentifier(tenantId, ...args): string;
```

Defined in: [00_Base/src/interfaces/cache/types.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L24)

#### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |
| ...`args`  | `any`[]  |

#### Returns

`string`

---

### getStationIdFromIdentifier()

```ts
function getStationIdFromIdentifier(identifier): string;
```

Defined in: [00_Base/src/interfaces/cache/types.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L30)

#### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `identifier` | `string` |

#### Returns

`string`

---

### getTenantIdFromIdentifier()

```ts
function getTenantIdFromIdentifier(identifier): number;
```

Defined in: [00_Base/src/interfaces/cache/types.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/types.ts#L26)

#### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `identifier` | `string` |

#### Returns

`number`
