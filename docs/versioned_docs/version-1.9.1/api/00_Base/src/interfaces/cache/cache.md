[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/cache/cache

# 00_Base/src/interfaces/cache/cache

## Interfaces

### ICache

Defined in: [00_Base/src/interfaces/cache/cache.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L12)

Interface for cache
Implementers SHALL ensure minimal logic outside of promise resolution or async function to prevent lag
Users of this interface can assume these methods behave asynchronously

#### Methods

##### exists()

```ts
exists(key, namespace?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/cache/cache.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L13)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`boolean`\>

##### get()

```ts
get<T>(
   key,
   namespace?,
classConstructor?): Promise<T | null>;
```

Defined in: [00_Base/src/interfaces/cache/cache.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L41)

Gets a value asynchronously from the underlying cache.

###### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

###### Parameters

| Parameter           | Type                            | Description                |
| ------------------- | ------------------------------- | -------------------------- |
| `key`               | `string`                        | The key for the value.     |
| `namespace?`        | `string`                        | The namespace for the key. |
| `classConstructor?` | () => `ClassConstructor`\<`T`\> | -                          |

###### Returns

`Promise`\<`T` \| `null`\>

- Returns the value as string or null if the key does not exist.

##### onChange()

```ts
onChange<T>(
   key,
   waitSeconds?,
   namespace?,
classConstructor?): Promise<T | null>;
```

Defined in: [00_Base/src/interfaces/cache/cache.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L26)

Monitors a key for potential changes to its value.
If key-value does not exist this method will wait for it to exist or return null at the end of the wait period.
If value is removed, the method will return null.

###### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

###### Parameters

| Parameter           | Type                            | Description                                                                                            |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `key`               | `string`                        | The key for the value.                                                                                 |
| `waitSeconds?`      | `number`                        | The number of seconds after which the method should return if the value has not been modified by then. |
| `namespace?`        | `string`                        | The namespace for the key.                                                                             |
| `classConstructor?` | () => `ClassConstructor`\<`T`\> | -                                                                                                      |

###### Returns

`Promise`\<`T` \| `null`\>

Returns the value as string once it is modified or waitSeconds has elapsed; or null if the key does not exist.

##### remove()

```ts
remove(key, namespace?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/cache/cache.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L14)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`boolean`\>

##### set()

```ts
set(
   key,
   value,
   namespace?,
expireSeconds?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/cache/cache.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L56)

Sets a value asynchronously in the underlying cache.

###### Parameters

| Parameter        | Type     | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `key`            | `string` | The key for the value.                                   |
| `value`          | `string` | The value to set.                                        |
| `namespace?`     | `string` | The namespace for the key.                               |
| `expireSeconds?` | `number` | The number of seconds after which the key should expire. |

###### Returns

`Promise`\<`boolean`\>

- Returns true if the value was set successfully.

##### setIfNotExist()

```ts
setIfNotExist(
   key,
   value,
   namespace?,
expireSeconds?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/cache/cache.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/cache/cache.ts#L67)

Sets a value asynchronously in the underlying cache if it doesn't exist. Returns false if the key already exists.

###### Parameters

| Parameter        | Type     | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `key`            | `string` | The key for the value.                                   |
| `value`          | `string` | The value to set.                                        |
| `namespace?`     | `string` | The namespace for the key.                               |
| `expireSeconds?` | `number` | The number of seconds after which the key should expire. |

###### Returns

`Promise`\<`boolean`\>

- Returns true if the value was set successfully.
