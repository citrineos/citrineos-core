[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/cache/redis

# 02_Util/src/cache/redis

## Classes

### RedisCache

Defined in: [02_Util/src/cache/redis.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L20)

Implementation of cache interface with redis storage

#### Implements

- `ICache`

#### Constructors

##### Constructor

```ts
new RedisCache(clientOptions?): RedisCache;
```

Defined in: [02_Util/src/cache/redis.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L23)

###### Parameters

| Parameter        | Type                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| `clientOptions?` | `RedisClientOptions`\<`RedisModules`, `RedisFunctions`, `RedisScripts`\> |

###### Returns

[`RedisCache`](#rediscache)

#### Properties

| Property                       | Modifier  | Type                                                                  | Defined in                                                                                                                                                |
| ------------------------------ | --------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_client"></a> `_client` | `private` | `RedisClientType`\<`RedisModules`, `RedisFunctions`, `RedisScripts`\> | [02_Util/src/cache/redis.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L21) |

#### Methods

##### exists()

```ts
exists(key, namespace?): Promise<boolean>;
```

Defined in: [02_Util/src/cache/redis.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L37)

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

Defined in: [02_Util/src/cache/redis.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L114)

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

Defined in: [02_Util/src/cache/redis.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L49)

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

Defined in: [02_Util/src/cache/redis.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L43)

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

##### set()

```ts
set(
   key,
   value,
   namespace?,
expireSeconds?): Promise<boolean>;
```

Defined in: [02_Util/src/cache/redis.ts:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L132)

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

Defined in: [02_Util/src/cache/redis.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/cache/redis.ts#L144)

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
