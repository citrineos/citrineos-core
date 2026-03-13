[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 01_Data/src/util/Pbkdf2

# 01_Data/src/util/Pbkdf2

## Classes

### Pbkdf2

Defined in: [01_Data/src/util/Pbkdf2.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L7)

#### Implements

- [`PasswordHashAlgorithm`](PasswordHashAlgorithm.md#passwordhashalgorithm)

#### Constructors

##### Constructor

```ts
new Pbkdf2(): Pbkdf2;
```

###### Returns

[`Pbkdf2`](#pbkdf2)

#### Properties

| Property                             | Type     | Default value | Defined in                                                                                                                                                |
| ------------------------------------ | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="digest"></a> `digest`         | `string` | `'sha512'`    | [01_Data/src/util/Pbkdf2.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L10) |
| <a id="iterations"></a> `iterations` | `number` | `1000`        | [01_Data/src/util/Pbkdf2.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L8)   |
| <a id="keylen"></a> `keyLen`         | `number` | `64`          | [01_Data/src/util/Pbkdf2.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L9)   |

#### Methods

##### getHashFromStringWithSalt()

```ts
getHashFromStringWithSalt(str, salt): string;
```

Defined in: [01_Data/src/util/Pbkdf2.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L24)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `str`     | `string` |
| `salt`    | `string` |

###### Returns

`string`

##### getSaltedHash()

```ts
getSaltedHash(password): string;
```

Defined in: [01_Data/src/util/Pbkdf2.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L12)

Generates a salted hash for a given password.

###### Parameters

| Parameter  | Type     | Description              |
| ---------- | -------- | ------------------------ |
| `password` | `string` | The plain text password. |

###### Returns

`string`

A string containing the salt and hash separated by a colon.

###### Implementation of

[`PasswordHashAlgorithm`](PasswordHashAlgorithm.md#passwordhashalgorithm).[`getSaltedHash`](PasswordHashAlgorithm.md#getsaltedhash)

##### isHashMatch()

```ts
isHashMatch(storedValue, inputPassword): boolean;
```

Defined in: [01_Data/src/util/Pbkdf2.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/Pbkdf2.ts#L18)

Validates if an input password matches a stored salted hash.

###### Parameters

| Parameter       | Type     | Description                                                     |
| --------------- | -------- | --------------------------------------------------------------- |
| `storedValue`   | `string` | The stored value containing salt and hash separated by a colon. |
| `inputPassword` | `string` | The input password to validate.                                 |

###### Returns

`boolean`

A boolean indicating if the password matches.

###### Implementation of

[`PasswordHashAlgorithm`](PasswordHashAlgorithm.md#passwordhashalgorithm).[`isHashMatch`](PasswordHashAlgorithm.md#ishashmatch)
