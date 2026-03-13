[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/cache/memory

# 02_Util/src/cache/memory

## Classes

### MemoryCache

Defined in: [02_Util/src/cache/memory.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L12)

Implementation of cache interface with memory storage

#### Implements

- `ICache`

#### Constructors

##### Constructor

```ts
new MemoryCache(): MemoryCache;
```

Defined in: [02_Util/src/cache/memory.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L18)

###### Returns

[`MemoryCache`](#memorycache)

#### Properties

| Property                                                             | Modifier  | Type                                               | Defined in                                                                                                                                                  |
| -------------------------------------------------------------------- | --------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_cache"></a> `_cache`                                         | `private` | `Map`\<`string`, `string`\>                        | [02_Util/src/cache/memory.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L13) |
| <a id="_keysubscriptionmap"></a> `_keySubscriptionMap`               | `private` | `Map`\<`string`, (`arg`) => `void`\>               | [02_Util/src/cache/memory.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L14) |
| <a id="_keysubscriptionpromisemap"></a> `_keySubscriptionPromiseMap` | `private` | `Map`\<`string`, `Promise`\<`string` \| `null`\>\> | [02_Util/src/cache/memory.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L15) |
| <a id="_timeoutmap"></a> `_timeoutMap`                               | `private` | `Map`\<`string`, `Timeout`\>                       | [02_Util/src/cache/memory.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L16) |

#### Methods

##### exists()

```ts
exists(key, namespace?): Promise<boolean>;
```

Defined in: [02_Util/src/cache/memory.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L54)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

```ts
ICache.exists;
```

##### get()

```ts
get<T>(
   key,
   namespace?,
classConstructor?): Promise<T | null>;
```

Defined in: [02_Util/src/cache/memory.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L114)

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

###### Implementation of

```ts
ICache.get;
```

##### onChange()

```ts
onChange<T>(
   key,
   waitSeconds,
   namespace?,
classConstructor?): Promise<T | null>;
```

Defined in: [02_Util/src/cache/memory.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L66)

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
| `waitSeconds`       | `number`                        | The number of seconds after which the method should return if the value has not been modified by then. |
| `namespace?`        | `string`                        | The namespace for the key.                                                                             |
| `classConstructor?` | () => `ClassConstructor`\<`T`\> | -                                                                                                      |

###### Returns

`Promise`\<`T` \| `null`\>

Returns the value as string once it is modified or waitSeconds has elapsed; or null if the key does not exist.

###### Implementation of

```ts
ICache.onChange;
```

##### remove()

```ts
remove(key, namespace?): Promise<boolean>;
```

Defined in: [02_Util/src/cache/memory.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L60)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

```ts
ICache.remove;
```

##### resolveOnChange()

```ts
private resolveOnChange(namespaceKey, value): void;
```

Defined in: [02_Util/src/cache/memory.ts:182](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L182)

###### Parameters

| Parameter      | Type     |
| -------------- | -------- |
| `namespaceKey` | `string` |
| `value`        | `string` |

###### Returns

`void`

##### set()

```ts
set(
   key,
   value,
   namespace?,
expireSeconds?): Promise<boolean>;
```

Defined in: [02_Util/src/cache/memory.ts:131](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L131)

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

###### Implementation of

```ts
ICache.set;
```

##### setIfNotExist()

```ts
setIfNotExist(
   key,
   value,
   namespace?,
expireSeconds?): Promise<boolean>;
```

Defined in: [02_Util/src/cache/memory.ts:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/memory.ts#L155)

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

###### Implementation of

```ts
ICache.setIfNotExist;
```
