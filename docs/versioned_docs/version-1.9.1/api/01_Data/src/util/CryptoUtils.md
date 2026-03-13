[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 01_Data/src/util/CryptoUtils

# 01_Data/src/util/CryptoUtils

## Classes

### CryptoUtils

Defined in: [01_Data/src/util/CryptoUtils.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/CryptoUtils.ts#L6)

#### Constructors

##### Constructor

```ts
new CryptoUtils(): CryptoUtils;
```

###### Returns

[`CryptoUtils`](#cryptoutils)

#### Properties

| Property                                                   | Modifier | Type                         | Defined in                                                                                                                                                        |
| ---------------------------------------------------------- | -------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="passwordhashalgorithm"></a> `passwordHashAlgorithm` | `static` | [`Pbkdf2`](Pbkdf2.md#pbkdf2) | [01_Data/src/util/CryptoUtils.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/CryptoUtils.ts#L7) |

#### Methods

##### getPasswordHash()

```ts
static getPasswordHash(password): string;
```

Defined in: [01_Data/src/util/CryptoUtils.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/CryptoUtils.ts#L9)

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `password` | `string` |

###### Returns

`string`

##### isPasswordMatch()

```ts
static isPasswordMatch(storedValue, inputPassword): boolean;
```

Defined in: [01_Data/src/util/CryptoUtils.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/CryptoUtils.ts#L13)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `storedValue`   | `string` |
| `inputPassword` | `string` |

###### Returns

`boolean`
