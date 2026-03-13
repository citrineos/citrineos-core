[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/interfaces/repository

# 00_Base/src/interfaces/repository

## Classes

### `abstract` CrudRepository

Defined in: [00_Base/src/interfaces/repository.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L18)

Represents a generic CRUD repository.

#### Extends

- `EventEmitter`

#### Type Parameters

| Type Parameter | Description                                      |
| -------------- | ------------------------------------------------ |
| `T`            | The type of the values stored in the repository. |

#### Constructors

##### Constructor

```ts
new CrudRepository<T>(): CrudRepository<T>;
```

Defined in: [00_Base/src/interfaces/repository.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L19)

###### Returns

[`CrudRepository`](#abstract-crudrepository)\<`T`\>

###### Overrides

```ts
EventEmitter.constructor;
```

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:274](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L274)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `value`      | `T`[]    |
| `namespace?` | `string` |

###### Returns

`Promise`\<`T`[]\>

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<T>;
```

Defined in: [00_Base/src/interfaces/repository.ts:273](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L273)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `value`      | `T`      |
| `namespace?` | `string` |

###### Returns

`Promise`\<`T`\>

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<T>;
```

Defined in: [00_Base/src/interfaces/repository.ts:276](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L276)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `value`      | `T`      |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`T`\>

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:309](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L309)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`T`[]\>

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
namespace?): Promise<T | undefined>;
```

Defined in: [00_Base/src/interfaces/repository.ts:303](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L303)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`T` \| `undefined`\>

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[T, boolean]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:283](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L283)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[`T`, `boolean`\]\>

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:296](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L296)

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<`T`[]\>

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<T | undefined>;
```

Defined in: [00_Base/src/interfaces/repository.ts:289](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L289)

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<`T` \| `undefined`\>

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L68)

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type     | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to create the entries.   |
| `values`     | `T`[]    | The values of the entries.                       |
| `clazz`      | `any`    | The class of the model.                          |
| `namespace?` | `string` | The optional namespace to create the entries in. |

###### Returns

`Promise`\<`T`[]\>

A Promise that resolves to the created entries.

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<T>;
```

Defined in: [00_Base/src/interfaces/repository.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L53)

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type     | Description                                    |
| ------------ | -------- | ---------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to create the entry.   |
| `value`      | `T`      | The value of the entry.                        |
| `namespace?` | `string` | The optional namespace to create the entry in. |

###### Returns

`Promise`\<`T`\>

A Promise that resolves to the created entry.

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<T>;
```

Defined in: [00_Base/src/interfaces/repository.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L88)

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type     | Description                                    |
| ------------ | -------- | ---------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to create the entry.   |
| `value`      | `T`      | The value of the entry.                        |
| `key`        | `string` | The key of the entry.                          |
| `namespace?` | `string` | The optional namespace to create the entry in. |

###### Returns

`Promise`\<`T`\>

A Promise that resolves to the created entry.

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:205](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L205)

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<`T`[]\>

A Promise that resolves to the deleted entries.

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
namespace?): Promise<T | undefined>;
```

Defined in: [00_Base/src/interfaces/repository.ts:187](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L187)

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<`T` \| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: [00_Base/src/interfaces/repository.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L41)

Emit method overridden to emit events from [CrudEvent](#crudevent).

###### Type Parameters

| Type Parameter                                       |
| ---------------------------------------------------- |
| `K` _extends_ keyof [`CrudEvent`](#crudevent)\<`T`\> |

###### Parameters

| Parameter | Type                                    | Description                                                                                                                 |
| --------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                     | The name of the event. Must be a key in [CrudEvent](#crudevent).                                                            |
| ...`args` | [`CrudEvent`](#crudevent)\<`T`\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in [CrudEvent](#crudevent). |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Overrides

```ts
EventEmitter.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: [00_Base/src/interfaces/repository.ts:271](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L271)

Checks how many values associated with a query exists in the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to check the query.          |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional. The namespace in which to check the query. |

###### Returns

`Promise`\<`number`\>

A Promise that resolves to the number of values matching the query.

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/repository.ts:261](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L261)

Checks if a key exists in the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                        |
| ------------ | -------- | -------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to check the key.          |
| `key`        | `string` | The key to check.                                  |
| `namespace?` | `string` | Optional. The namespace in which to check the key. |

###### Returns

`Promise`\<`boolean`\>

A Promise that resolves to a boolean indicating whether the key exists.

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: [00_Base/src/interfaces/repository.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L30)

On method overridden to handle events from [CrudEvent](#crudevent).

###### Type Parameters

| Type Parameter                                       |
| ---------------------------------------------------- |
| `K` _extends_ keyof [`CrudEvent`](#crudevent)\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                                        |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `event`    | `K`                   | The name of the event. Must be a key in [CrudEvent](#crudevent).                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in [CrudEvent](#crudevent). |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Overrides

```ts
EventEmitter.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:233](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L233)

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<`T`[]\>

A promise that resolves to the values associated with the query.

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
namespace?): Promise<T | undefined>;
```

Defined in: [00_Base/src/interfaces/repository.ts:219](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L219)

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<`T` \| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: [00_Base/src/interfaces/repository.ts:245](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L245)

Attempts to read next id.

###### Parameters

| Parameter     | Type     | Description                                                                  |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| `tenantId`    | `number` | The tenant ID for which to read the next value.                              |
| `columnName`  | `string` | The name of the column which needs a next value. The column must be integer. |
| `query?`      | `object` | The query to use.                                                            |
| `startValue?` | `number` | If no existing value is found, this value will be used. By default, it is 1. |
| `namespace?`  | `string` | Optional namespace for the query.                                            |

###### Returns

`Promise`\<`number`\>

An integer that is the next id to use

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
namespace?): Promise<T | undefined>;
```

Defined in: [00_Base/src/interfaces/repository.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L107)

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<`T` \| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[T, boolean]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L127)

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[`T`, `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<T[]>;
```

Defined in: [00_Base/src/interfaces/repository.ts:168](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L168)

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<`T`[]\>

A promise that resolves to the updated values associated with the query.

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<T | undefined>;
```

Defined in: [00_Base/src/interfaces/repository.ts:148](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L148)

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<`T` \| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

## Interfaces

### CrudEvent

Defined in: [00_Base/src/interfaces/repository.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L7)

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Properties

| Property                       | Type      | Defined in                                                                                                                                                                    |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="created"></a> `created` | \[`T`[]\] | [00_Base/src/interfaces/repository.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L8)   |
| <a id="deleted"></a> `deleted` | \[`T`[]\] | [00_Base/src/interfaces/repository.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L10) |
| <a id="updated"></a> `updated` | \[`T`[]\] | [00_Base/src/interfaces/repository.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/repository.ts#L9)   |
