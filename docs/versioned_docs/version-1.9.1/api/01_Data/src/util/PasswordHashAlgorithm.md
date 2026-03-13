[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 01_Data/src/util/PasswordHashAlgorithm

# 01_Data/src/util/PasswordHashAlgorithm

## Interfaces

### PasswordHashAlgorithm

Defined in: [01_Data/src/util/PasswordHashAlgorithm.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/PasswordHashAlgorithm.ts#L4)

#### Methods

##### getSaltedHash()

```ts
getSaltedHash(password): string;
```

Defined in: [01_Data/src/util/PasswordHashAlgorithm.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/PasswordHashAlgorithm.ts#L10)

Generates a salted hash for a given password.

###### Parameters

| Parameter  | Type     | Description              |
| ---------- | -------- | ------------------------ |
| `password` | `string` | The plain text password. |

###### Returns

`string`

A string containing the salt and hash separated by a colon.

##### isHashMatch()

```ts
isHashMatch(storedValue, inputPassword): boolean;
```

Defined in: [01_Data/src/util/PasswordHashAlgorithm.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/util/PasswordHashAlgorithm.ts#L18)

Validates if an input password matches a stored salted hash.

###### Parameters

| Parameter       | Type     | Description                                                     |
| --------------- | -------- | --------------------------------------------------------------- |
| `storedValue`   | `string` | The stored value containing salt and hash separated by a colon. |
| `inputPassword` | `string` | The input password to validate.                                 |

###### Returns

`boolean`

A boolean indicating if the password matches.
