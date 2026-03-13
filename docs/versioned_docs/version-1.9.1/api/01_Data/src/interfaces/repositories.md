[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 01_Data/src/interfaces/repositories

# 01_Data/src/interfaces/repositories

## Interfaces

### IAuthorizationRepository

Defined in: [01_Data/src/interfaces/repositories.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L68)

#### Extends

- `CrudRepository`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)\>

#### Properties

| Property                                                         | Type                                                                                                                                               | Defined in                                                                                                                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="readallbyquerystring"></a> `readAllByQuerystring`         | (`tenantId`, `query`) => `Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>                  | [01_Data/src/interfaces/repositories.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L69) |
| <a id="readonlyonebyquerystring"></a> `readOnlyOneByQuerystring` | (`tenantId`, `query`) => `Promise`\< \| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization) \| `undefined`\> | [01_Data/src/interfaces/repositories.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L73) |

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                    |
| `value`      | [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[] |
| `namespace?` | `string`                                                                                    |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Authorization>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                  |
| `value`      | [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization) |
| `namespace?` | `string`                                                                                  |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Authorization>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                  |
| `value`      | [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization) |
| `key`        | `string`                                                                                  |
| `namespace?` | `string`                                                                                  |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Authorization
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Authorization, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Authorization
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                        | Description                                      |
| ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                    | The tenant ID for which to create the entries.   |
| `values`     | [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                       | The class of the model.                          |
| `namespace?` | `string`                                                                                    | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<Authorization>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                      | Description                                    |
| ------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                  | The tenant ID for which to create the entry.   |
| `value`      | [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization) | The value of the entry.                        |
| `namespace?` | `string`                                                                                  | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Authorization>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                      | Description                                    |
| ------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                  | The tenant ID for which to create the entry.   |
| `value`      | [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization) | The value of the entry.                        |
| `key`        | `string`                                                                                  | The key of the entry.                          |
| `namespace?` | `string`                                                                                  | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Authorization
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                            | Description                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                             | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Authorization
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | Authorization
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Authorization, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Authorization[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Authorization
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`Authorization`](../layers/sequelize/model/Authorization/Authorization.md#authorization)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IBootRepository

Defined in: [01_Data/src/interfaces/repositories.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L82)

Key is StationId

#### Extends

- `CrudRepository`\<`BootConfig`\>

#### Properties

| Property                                                       | Type                                                                                                                        | Description                                        | Overrides                    | Defined in                                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="createorupdatebykey"></a> `createOrUpdateByKey`         | (`tenantId`, `value`, `key`) => `Promise`\<[`Boot`](../layers/sequelize/model/Boot.md#boot) \| `undefined`\>                | -                                                  | -                            | [01_Data/src/interfaces/repositories.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L83)   |
| <a id="deletebykey-1"></a> `deleteByKey`                       | (`tenantId`, `key`) => `Promise`\<[`Boot`](../layers/sequelize/model/Boot.md#boot) \| `undefined`\>                         | Deletes a key from the specified namespace.        | `CrudRepository.deleteByKey` | [01_Data/src/interfaces/repositories.ts:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L101) |
| <a id="existsbykey-1"></a> `existsByKey`                       | (`tenantId`, `key`) => `Promise`\<`boolean`\>                                                                               | Checks if a key exists in the specified namespace. | `CrudRepository.existsByKey` | [01_Data/src/interfaces/repositories.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L100) |
| <a id="readbykey-1"></a> `readByKey`                           | (`tenantId`, `key`) => `Promise`\<[`Boot`](../layers/sequelize/model/Boot.md#boot) \| `undefined`\>                         | Reads a value from storage based on the given key. | `CrudRepository.readByKey`   | [01_Data/src/interfaces/repositories.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L99)   |
| <a id="updatelastboottimebykey"></a> `updateLastBootTimeByKey` | (`tenantId`, `lastBootTime`, `key`) => `Promise`\<[`Boot`](../layers/sequelize/model/Boot.md#boot) \| `undefined`\>         | -                                                  | -                            | [01_Data/src/interfaces/repositories.ts:94](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L94)   |
| <a id="updatestatusbykey"></a> `updateStatusByKey`             | (`tenantId`, `status`, `statusInfo`, `key`) => `Promise`\<[`Boot`](../layers/sequelize/model/Boot.md#boot) \| `undefined`\> | -                                                  | -                            | [01_Data/src/interfaces/repositories.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L88)   |

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type           |
| ------------ | -------------- |
| `tenantId`   | `number`       |
| `value`      | `BootConfig`[] |
| `namespace?` | `string`       |

###### Returns

`Promise`\<`BootConfig`[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<BootConfig>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type         |
| ------------ | ------------ |
| `tenantId`   | `number`     |
| `value`      | `BootConfig` |
| `namespace?` | `string`     |

###### Returns

`Promise`\<`BootConfig`\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<BootConfig>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type         |
| ------------ | ------------ |
| `tenantId`   | `number`     |
| `value`      | `BootConfig` |
| `key`        | `string`     |
| `namespace?` | `string`     |

###### Returns

`Promise`\<`BootConfig`\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`BootConfig`[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
namespace?): Promise<BootConfig | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`BootConfig` \| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[BootConfig, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[`BootConfig`, `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<`BootConfig`[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<BootConfig | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<`BootConfig` \| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type           | Description                                      |
| ------------ | -------------- | ------------------------------------------------ |
| `tenantId`   | `number`       | The tenant ID for which to create the entries.   |
| `values`     | `BootConfig`[] | The values of the entries.                       |
| `clazz`      | `any`          | The class of the model.                          |
| `namespace?` | `string`       | The optional namespace to create the entries in. |

###### Returns

`Promise`\<`BootConfig`[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<BootConfig>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type         | Description                                    |
| ------------ | ------------ | ---------------------------------------------- |
| `tenantId`   | `number`     | The tenant ID for which to create the entry.   |
| `value`      | `BootConfig` | The value of the entry.                        |
| `namespace?` | `string`     | The optional namespace to create the entry in. |

###### Returns

`Promise`\<`BootConfig`\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<BootConfig>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type         | Description                                    |
| ------------ | ------------ | ---------------------------------------------- |
| `tenantId`   | `number`     | The tenant ID for which to create the entry.   |
| `value`      | `BootConfig` | The value of the entry.                        |
| `key`        | `string`     | The key of the entry.                          |
| `namespace?` | `string`     | The optional namespace to create the entry in. |

###### Returns

`Promise`\<`BootConfig`\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<`BootConfig`[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                               | Description                                                                                                   |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<`BootConfig`\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<`BootConfig`[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
namespace?): Promise<BootConfig | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<`BootConfig` \| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[BootConfig, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[`BootConfig`, `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<BootConfig[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<`BootConfig`[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<BootConfig | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<`BootConfig` \| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### ICertificateRepository

Defined in: [01_Data/src/interfaces/repositories.ts:418](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L418)

#### Extends

- `CrudRepository`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                            |
| `value`      | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[] |
| `namespace?` | `string`                                                                            |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Certificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                          |
| `value`      | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate) |
| `namespace?` | `string`                                                                          |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Certificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                          |
| `value`      | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate) |
| `key`        | `string`                                                                          |
| `namespace?` | `string`                                                                          |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Certificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Certificate, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Certificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                | Description                                      |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                            | The tenant ID for which to create the entries.   |
| `values`     | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                               | The class of the model.                          |
| `namespace?` | `string`                                                                            | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<Certificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                              | Description                                    |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate) | The value of the entry.                        |
| `namespace?` | `string`                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Certificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                              | Description                                    |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate) | The value of the entry.                        |
| `key`        | `string`                                                                          | The key of the entry.                          |
| `namespace?` | `string`                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateCertificate()

```ts
createOrUpdateCertificate(tenantId, certificate): Promise<Certificate>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:419](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L419)

###### Parameters

| Parameter     | Type                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| `tenantId`    | `number`                                                                          |
| `certificate` | [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate) |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Certificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                    | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                     | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Certificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | Certificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Certificate, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Certificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Certificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`Certificate`](../layers/sequelize/model/Certificate/Certificate.md#certificate)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IChangeConfigurationRepository

Defined in: [01_Data/src/interfaces/repositories.ts:505](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L505)

#### Extends

- `CrudRepository`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                        |
| `value`      | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[] |
| `namespace?` | `string`                                                                                        |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<ChangeConfiguration>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                      |
| `value`      | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration) |
| `namespace?` | `string`                                                                                      |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChangeConfiguration>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                      |
| `value`      | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration) |
| `key`        | `string`                                                                                      |
| `namespace?` | `string`                                                                                      |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChangeConfiguration, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                            | Description                                      |
| ------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                        | The tenant ID for which to create the entries.   |
| `values`     | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                           | The class of the model.                          |
| `namespace?` | `string`                                                                                        | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<ChangeConfiguration>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                          | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                      | The tenant ID for which to create the entry.   |
| `value`      | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration) | The value of the entry.                        |
| `namespace?` | `string`                                                                                      | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChangeConfiguration>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                          | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                      | The tenant ID for which to create the entry.   |
| `value`      | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration) | The value of the entry.                        |
| `key`        | `string`                                                                                      | The key of the entry.                          |
| `namespace?` | `string`                                                                                      | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateChangeConfiguration()

```ts
createOrUpdateChangeConfiguration(tenantId, configuration): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:506](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L506)

###### Parameters

| Parameter       | Type                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- |
| `tenantId`      | `number`                                                                                      |
| `configuration` | [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration) |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                 | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChangeConfiguration, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChangeConfiguration[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChangeConfiguration
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`ChangeConfiguration`](../layers/sequelize/model/ChangeConfiguration.md#changeconfiguration)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IChargingProfileRepository

Defined in: [01_Data/src/interfaces/repositories.ts:428](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L428)

#### Extends

- `CrudRepository`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                            |
| `value`      | [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[] |
| `namespace?` | `string`                                                                                            |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<ChargingProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                          |
| `value`      | [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile) |
| `namespace?` | `string`                                                                                          |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChargingProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                          |
| `value`      | [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile) |
| `key`        | `string`                                                                                          |
| `namespace?` | `string`                                                                                          |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChargingProfile, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChargingProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                | Description                                      |
| ------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                            | The tenant ID for which to create the entries.   |
| `values`     | [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                               | The class of the model.                          |
| `namespace?` | `string`                                                                                            | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<ChargingProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                              | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile) | The value of the entry.                        |
| `namespace?` | `string`                                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChargingProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                              | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile) | The value of the entry.                        |
| `key`        | `string`                                                                                          | The key of the entry.                          |
| `namespace?` | `string`                                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createChargingNeeds()

```ts
createChargingNeeds(
   tenantId,
   chargingNeeds,
stationId): Promise<ChargingNeeds>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:437](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L437)

###### Parameters

| Parameter       | Type                           |
| --------------- | ------------------------------ |
| `tenantId`      | `number`                       |
| `chargingNeeds` | `NotifyEVChargingNeedsRequest` |
| `stationId`     | `string`                       |

###### Returns

`Promise`\<[`ChargingNeeds`](../layers/sequelize/model/ChargingProfile/ChargingNeeds.md#chargingneeds)\>

##### createCompositeSchedule()

```ts
createCompositeSchedule(
   tenantId,
   compositeSchedule,
stationId): Promise<CompositeSchedule>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:447](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L447)

###### Parameters

| Parameter           | Type                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `tenantId`          | `number`                                                                                                     |
| `compositeSchedule` | [`CompositeScheduleInput`](../layers/sequelize/mapper/2.0.1/ChargingProfileMapper.md#compositescheduleinput) |
| `stationId`         | `string`                                                                                                     |

###### Returns

`Promise`\<[`CompositeSchedule`](../layers/sequelize/model/ChargingProfile/CompositeSchedule.md#compositeschedule)\>

##### createOrUpdateChargingProfile()

```ts
createOrUpdateChargingProfile(
   tenantId,
   chargingProfile,
   stationId,
   evseId?,
   chargingLimitSource?,
isActive?): Promise<ChargingProfile>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:429](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L429)

###### Parameters

| Parameter              | Type                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `tenantId`             | `number`                                                                                                 |
| `chargingProfile`      | [`ChargingProfileInput`](../layers/sequelize/mapper/2.0.1/ChargingProfileMapper.md#chargingprofileinput) |
| `stationId`            | `string`                                                                                                 |
| `evseId?`              | `number` \| `null`                                                                                       |
| `chargingLimitSource?` | `"EMS"` \| `"Other"` \| `"SO"` \| `"CSO"`                                                                |
| `isActive?`            | `boolean`                                                                                                |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                    | Description                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                     | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### findChargingNeedsByEvseDBIdAndTransactionDBId()

```ts
findChargingNeedsByEvseDBIdAndTransactionDBId(
   tenantId,
   evseDBId,
   transactionDataBaseId): Promise<
  | ChargingNeeds
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:442](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L442)

###### Parameters

| Parameter               | Type     |
| ----------------------- | -------- |
| `tenantId`              | `number` |
| `evseDBId`              | `number` |
| `transactionDataBaseId` | `number` |

###### Returns

`Promise`\<
\| [`ChargingNeeds`](../layers/sequelize/model/ChargingProfile/ChargingNeeds.md#chargingneeds)
\| `undefined`\>

##### getNextChargingProfileId()

```ts
getNextChargingProfileId(tenantId, stationId): Promise<number>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:452](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L452)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`number`\>

##### getNextChargingScheduleId()

```ts
getNextChargingScheduleId(tenantId, stationId): Promise<number>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:453](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L453)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`number`\>

##### getNextStackLevel()

```ts
getNextStackLevel(
   tenantId,
   stationId,
   transactionDatabaseId,
profilePurpose): Promise<number>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:454](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L454)

###### Parameters

| Parameter               | Type                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tenantId`              | `number`                                                                                                            |
| `stationId`             | `string`                                                                                                            |
| `transactionDatabaseId` | `number` \| `null`                                                                                                  |
| `profilePurpose`        | \| `"ChargingStationExternalConstraints"` \| `"ChargingStationMaxProfile"` \| `"TxDefaultProfile"` \| `"TxProfile"` |

###### Returns

`Promise`\<`number`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | ChargingProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChargingProfile, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChargingProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChargingProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`ChargingProfile`](../layers/sequelize/model/ChargingProfile/ChargingProfile.md#chargingprofile)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IChargingStationSecurityInfoRepository

Defined in: [01_Data/src/interfaces/repositories.ts:479](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L479)

#### Extends

- `CrudRepository`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                |
| `value`      | [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[] |
| `namespace?` | `string`                                                                                                                |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<ChargingStationSecurityInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                              |
| `value`      | [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo) |
| `namespace?` | `string`                                                                                                              |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChargingStationSecurityInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                              |
| `value`      | [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo) |
| `key`        | `string`                                                                                                              |
| `namespace?` | `string`                                                                                                              |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingStationSecurityInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChargingStationSecurityInfo, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChargingStationSecurityInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                                    | Description                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                                | The tenant ID for which to create the entries.   |
| `values`     | [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                                   | The class of the model.                          |
| `namespace?` | `string`                                                                                                                | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<ChargingStationSecurityInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChargingStationSecurityInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo) | The value of the entry.                        |
| `key`        | `string`                                                                                                              | The key of the entry.                          |
| `namespace?` | `string`                                                                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingStationSecurityInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                                        | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                                         | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingStationSecurityInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readChargingStationPublicKeyFileId()

```ts
readChargingStationPublicKeyFileId(tenantId, stationId): Promise<string>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:481](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L481)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`string`\>

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | ChargingStationSecurityInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChargingStationSecurityInfo, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### readOrCreateChargingStationInfo()

```ts
readOrCreateChargingStationInfo(
   tenantId,
   stationId,
publicKeyFileId): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:482](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L482)

###### Parameters

| Parameter         | Type     |
| ----------------- | -------- |
| `tenantId`        | `number` |
| `stationId`       | `string` |
| `publicKeyFileId` | `string` |

###### Returns

`Promise`\<`void`\>

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChargingStationSecurityInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChargingStationSecurityInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`ChargingStationSecurityInfo`](../layers/sequelize/model/ChargingStationSecurityInfo.md#chargingstationsecurityinfo)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IChargingStationSequenceRepository

Defined in: [01_Data/src/interfaces/repositories.ts:489](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L489)

#### Extends

- `CrudRepository`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                            |
| `value`      | [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[] |
| `namespace?` | `string`                                                                                                                            |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<ChargingStationSequence>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                          |
| `value`      | [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence) |
| `namespace?` | `string`                                                                                                                          |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChargingStationSequence>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                          |
| `value`      | [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence) |
| `key`        | `string`                                                                                                                          |
| `namespace?` | `string`                                                                                                                          |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingStationSequence
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChargingStationSequence, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChargingStationSequence
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                                                | Description                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                                            | The tenant ID for which to create the entries.   |
| `values`     | [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                                               | The class of the model.                          |
| `namespace?` | `string`                                                                                                                            | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<ChargingStationSequence>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                                              | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ChargingStationSequence>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                                              | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence) | The value of the entry.                        |
| `key`        | `string`                                                                                                                          | The key of the entry.                          |
| `namespace?` | `string`                                                                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingStationSequence
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                                                    | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                                                     | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### getNextSequenceValue()

```ts
getNextSequenceValue(
   tenantId,
   stationId,
type): Promise<number>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:491](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L491)

###### Parameters

| Parameter   | Type                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`  | `number`                                                                                                                                                                                                                                              |
| `stationId` | `string`                                                                                                                                                                                                                                              |
| `type`      | \| `"transactionId"` \| `"remoteStartId"` \| `"customerInformation"` \| `"getBaseReport"` \| `"getChargingProfiles"` \| `"getDisplayMessages"` \| `"getLog"` \| `"getMonitoringReport"` \| `"getReport"` \| `"publishFirmware"` \| `"updateFirmware"` |

###### Returns

`Promise`\<`number`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ChargingStationSequence
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | ChargingStationSequence
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ChargingStationSequence, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ChargingStationSequence[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ChargingStationSequence
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`ChargingStationSequence`](../layers/sequelize/model/ChargingStationSequence/ChargingStationSequence.md#chargingstationsequence)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IDeleteCertificateAttemptRepository

Defined in: [01_Data/src/interfaces/repositories.ts:425](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L425)

#### Extends

- `CrudRepository`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                   |
| `value`      | [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[] |
| `namespace?` | `string`                                                                                                                   |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<DeleteCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `tenantId`   | `number`                                                                                                                 |
| `value`      | [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt) |
| `namespace?` | `string`                                                                                                                 |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<DeleteCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `tenantId`   | `number`                                                                                                                 |
| `value`      | [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt) |
| `key`        | `string`                                                                                                                 |
| `namespace?` | `string`                                                                                                                 |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | DeleteCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[DeleteCertificateAttempt, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | DeleteCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                                       | Description                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                                   | The tenant ID for which to create the entries.   |
| `values`     | [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                                      | The class of the model.                          |
| `namespace?` | `string`                                                                                                                   | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<DeleteCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                                     | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                                 | The tenant ID for which to create the entry.   |
| `value`      | [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                                 | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<DeleteCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                                     | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                                 | The tenant ID for which to create the entry.   |
| `value`      | [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt) | The value of the entry.                        |
| `key`        | `string`                                                                                                                 | The key of the entry.                          |
| `namespace?` | `string`                                                                                                                 | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | DeleteCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                                           | Description                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                                            | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | DeleteCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | DeleteCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[DeleteCertificateAttempt, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<DeleteCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | DeleteCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`DeleteCertificateAttempt`](../layers/sequelize/model/Certificate/DeleteCertificateAttempt.md#deletecertificateattempt)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IDeviceModelRepository

Defined in: [01_Data/src/interfaces/repositories.ts:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L104)

#### Extends

- `CrudRepository`\<`OCPP2_0_1.VariableAttributeType`\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                      |
| ------------ | ------------------------- |
| `tenantId`   | `number`                  |
| `value`      | `VariableAttributeType`[] |
| `namespace?` | `string`                  |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<VariableAttributeType>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                    |
| ------------ | ----------------------- |
| `tenantId`   | `number`                |
| `value`      | `VariableAttributeType` |
| `namespace?` | `string`                |

###### Returns

`Promise`\<`VariableAttributeType`\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableAttributeType>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                    |
| ------------ | ----------------------- |
| `tenantId`   | `number`                |
| `value`      | `VariableAttributeType` |
| `key`        | `string`                |
| `namespace?` | `string`                |

###### Returns

`Promise`\<`VariableAttributeType`\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
namespace?): Promise<VariableAttributeType | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<`VariableAttributeType` \| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[VariableAttributeType, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[`VariableAttributeType`, `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableAttributeType | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<`VariableAttributeType` \| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                      | Description                                      |
| ------------ | ------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                  | The tenant ID for which to create the entries.   |
| `values`     | `VariableAttributeType`[] | The values of the entries.                       |
| `clazz`      | `any`                     | The class of the model.                          |
| `namespace?` | `string`                  | The optional namespace to create the entries in. |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<VariableAttributeType>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                    | Description                                    |
| ------------ | ----------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                | The tenant ID for which to create the entry.   |
| `value`      | `VariableAttributeType` | The value of the entry.                        |
| `namespace?` | `string`                | The optional namespace to create the entry in. |

###### Returns

`Promise`\<`VariableAttributeType`\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableAttributeType>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                    | Description                                    |
| ------------ | ----------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                | The tenant ID for which to create the entry.   |
| `value`      | `VariableAttributeType` | The value of the entry.                        |
| `key`        | `string`                | The key of the entry.                          |
| `namespace?` | `string`                | The optional namespace to create the entry in. |

###### Returns

`Promise`\<`VariableAttributeType`\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateByGetVariablesResultAndStationId()

```ts
createOrUpdateByGetVariablesResultAndStationId(
   tenantId,
   getVariablesResult,
   stationId,
isoTimestamp): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L111)

###### Parameters

| Parameter            | Type                      |
| -------------------- | ------------------------- |
| `tenantId`           | `number`                  |
| `getVariablesResult` | `GetVariableResultType`[] |
| `stationId`          | `string`                  |
| `isoTimestamp`       | `string`                  |

###### Returns

`Promise`\<[`VariableAttribute`](../layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

##### createOrUpdateBySetVariablesDataAndStationId()

```ts
createOrUpdateBySetVariablesDataAndStationId(
   tenantId,
   setVariablesData,
   stationId,
isoTimestamp): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L117)

###### Parameters

| Parameter          | Type                    |
| ------------------ | ----------------------- |
| `tenantId`         | `number`                |
| `setVariablesData` | `SetVariableDataType`[] |
| `stationId`        | `string`                |
| `isoTimestamp`     | `string`                |

###### Returns

`Promise`\<[`VariableAttribute`](../layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

##### createOrUpdateDeviceModelByStationId()

```ts
createOrUpdateDeviceModelByStationId(
   tenantId,
   value,
   stationId,
isoTimestamp): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L105)

###### Parameters

| Parameter      | Type             |
| -------------- | ---------------- |
| `tenantId`     | `number`         |
| `value`        | `ReportDataType` |
| `stationId`    | `string`         |
| `isoTimestamp` | `string`         |

###### Returns

`Promise`\<[`VariableAttribute`](../layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteAllByQuerystring()

```ts
deleteAllByQuerystring(tenantId, query): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L138)

###### Parameters

| Parameter  | Type                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                                    |
| `query`    | [`VariableAttributeQuerystring`](queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`Promise`\<[`VariableAttribute`](../layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
namespace?): Promise<VariableAttributeType | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<`VariableAttributeType` \| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                          | Description                                                                                                   |
| --------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                           | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<`VariableAttributeType`\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existByQuerystring()

```ts
existByQuerystring(tenantId, query): Promise<number>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:137](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L137)

###### Parameters

| Parameter  | Type                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                                    |
| `query`    | [`VariableAttributeQuerystring`](queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`Promise`\<`number`\>

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### findComponentAndVariable()

```ts
findComponentAndVariable(
   tenantId,
   componentType,
   variableType): Promise<[
  | Component
  | undefined,
  | Variable
| undefined]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:142](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L142)

###### Parameters

| Parameter       | Type            |
| --------------- | --------------- |
| `tenantId`      | `number`        |
| `componentType` | `ComponentType` |
| `variableType`  | `VariableType`  |

###### Returns

`Promise`\<\[
\| [`Component`](../layers/sequelize/model/DeviceModel/Component.md#component)
\| `undefined`,
\| [`Variable`](../layers/sequelize/model/DeviceModel/Variable.md#variable)
\| `undefined`\]\>

##### findEvseByIdAndConnectorId()

```ts
findEvseByIdAndConnectorId(
   tenantId,
   id,
   connectorId): Promise<
  | EvseType
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:157](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L157)

###### Parameters

| Parameter     | Type               |
| ------------- | ------------------ |
| `tenantId`    | `number`           |
| `id`          | `number`           |
| `connectorId` | `number` \| `null` |

###### Returns

`Promise`\<
\| [`EvseType`](../layers/sequelize/model/DeviceModel/EvseType.md#evsetype)
\| `undefined`\>

##### findOrCreateEvseAndComponent()

```ts
findOrCreateEvseAndComponent(
   tenantId,
   componentType,
stationId): Promise<Component>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:152](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L152)

###### Parameters

| Parameter       | Type            |
| --------------- | --------------- |
| `tenantId`      | `number`        |
| `componentType` | `ComponentType` |
| `stationId`     | `string`        |

###### Returns

`Promise`\<[`Component`](../layers/sequelize/model/DeviceModel/Component.md#component)\>

##### findOrCreateEvseAndComponentAndVariable()

```ts
findOrCreateEvseAndComponentAndVariable(
   tenantId,
   componentType,
variableType): Promise<[Component, Variable]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L147)

###### Parameters

| Parameter       | Type            |
| --------------- | --------------- |
| `tenantId`      | `number`        |
| `componentType` | `ComponentType` |
| `variableType`  | `VariableType`  |

###### Returns

`Promise`\<\[[`Component`](../layers/sequelize/model/DeviceModel/Component.md#component), [`Variable`](../layers/sequelize/model/DeviceModel/Variable.md#variable)\]\>

##### findVariableCharacteristicsByVariableNameAndVariableInstance()

```ts
findVariableCharacteristicsByVariableNameAndVariableInstance(
   tenantId,
   variableName,
   variableInstance): Promise<
  | VariableCharacteristics
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:162](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L162)

###### Parameters

| Parameter          | Type               |
| ------------------ | ------------------ |
| `tenantId`         | `number`           |
| `variableName`     | `string`           |
| `variableInstance` | `string` \| `null` |

###### Returns

`Promise`\<
\| [`VariableCharacteristics`](../layers/sequelize/model/DeviceModel/VariableCharacteristics.md#variablecharacteristics)
\| `undefined`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readAllByQuerystring()

```ts
readAllByQuerystring(tenantId, query): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:133](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L133)

###### Parameters

| Parameter  | Type                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                                    |
| `query`    | [`VariableAttributeQuerystring`](queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`Promise`\<[`VariableAttribute`](../layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

##### readAllSetVariableByStationId()

```ts
readAllSetVariableByStationId(tenantId, stationId): Promise<SetVariableDataType[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L129)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`SetVariableDataType`[]\>

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
namespace?): Promise<VariableAttributeType | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<`VariableAttributeType` \| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttributeType | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<`VariableAttributeType` \| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[VariableAttributeType, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[`VariableAttributeType`, `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<VariableAttributeType[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<`VariableAttributeType`[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableAttributeType | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<`VariableAttributeType` \| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### updateResultByStationId()

```ts
updateResultByStationId(
   tenantId,
   result,
   stationId,
   isoTimestamp): Promise<
  | VariableAttribute
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L123)

###### Parameters

| Parameter      | Type                    |
| -------------- | ----------------------- |
| `tenantId`     | `number`                |
| `result`       | `SetVariableResultType` |
| `stationId`    | `string`                |
| `isoTimestamp` | `string`                |

###### Returns

`Promise`\<
\| [`VariableAttribute`](../layers/sequelize/model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

---

### IInstallCertificateAttemptRepository

Defined in: [01_Data/src/interfaces/repositories.ts:423](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L423)

#### Extends

- `CrudRepository`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                      |
| `value`      | [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[] |
| `namespace?` | `string`                                                                                                                      |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<InstallCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                    |
| `value`      | [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt) |
| `namespace?` | `string`                                                                                                                    |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<InstallCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                                    |
| `value`      | [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt) |
| `key`        | `string`                                                                                                                    |
| `namespace?` | `string`                                                                                                                    |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | InstallCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[InstallCertificateAttempt, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | InstallCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                                          | Description                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                                      | The tenant ID for which to create the entries.   |
| `values`     | [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                                         | The class of the model.                          |
| `namespace?` | `string`                                                                                                                      | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<InstallCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                                        | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                                    | The tenant ID for which to create the entry.   |
| `value`      | [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                                    | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<InstallCertificateAttempt>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                                        | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                                    | The tenant ID for which to create the entry.   |
| `value`      | [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt) | The value of the entry.                        |
| `key`        | `string`                                                                                                                    | The key of the entry.                          |
| `namespace?` | `string`                                                                                                                    | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | InstallCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                                              | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                                               | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | InstallCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | InstallCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[InstallCertificateAttempt, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<InstallCertificateAttempt[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | InstallCertificateAttempt
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`InstallCertificateAttempt`](../layers/sequelize/model/Certificate/InstallCertificateAttempt.md#installcertificateattempt)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IInstalledCertificateRepository

Defined in: [01_Data/src/interfaces/repositories.ts:422](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L422)

#### Extends

- `CrudRepository`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                       |
| `value`      | [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[] |
| `namespace?` | `string`                                                                                                       |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<InstalledCertificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `tenantId`   | `number`                                                                                                     |
| `value`      | [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate) |
| `namespace?` | `string`                                                                                                     |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<InstalledCertificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `tenantId`   | `number`                                                                                                     |
| `value`      | [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate) |
| `key`        | `string`                                                                                                     |
| `namespace?` | `string`                                                                                                     |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | InstalledCertificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[InstalledCertificate, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | InstalledCertificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                           | Description                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                       | The tenant ID for which to create the entries.   |
| `values`     | [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                          | The class of the model.                          |
| `namespace?` | `string`                                                                                                       | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<InstalledCertificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                         | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                     | The tenant ID for which to create the entry.   |
| `value`      | [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                     | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<InstalledCertificate>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                         | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                     | The tenant ID for which to create the entry.   |
| `value`      | [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate) | The value of the entry.                        |
| `key`        | `string`                                                                                                     | The key of the entry.                          |
| `namespace?` | `string`                                                                                                     | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | InstalledCertificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                               | Description                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                                | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | InstalledCertificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | InstalledCertificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[InstalledCertificate, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<InstalledCertificate[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | InstalledCertificate
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`InstalledCertificate`](../layers/sequelize/model/Certificate/InstalledCertificate.md#installedcertificate)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### ILocalAuthListRepository

Defined in: [01_Data/src/interfaces/repositories.ts:169](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L169)

#### Extends

- `CrudRepository`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                             |
| `value`      | [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[] |
| `namespace?` | `string`                                                                                             |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<LocalListVersion>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                           |
| `value`      | [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion) |
| `namespace?` | `string`                                                                                           |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<LocalListVersion>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                           |
| `value`      | [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion) |
| `key`        | `string`                                                                                           |
| `namespace?` | `string`                                                                                           |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | LocalListVersion
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[LocalListVersion, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | LocalListVersion
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                 | Description                                      |
| ------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                             | The tenant ID for which to create the entries.   |
| `values`     | [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                | The class of the model.                          |
| `namespace?` | `string`                                                                                             | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<LocalListVersion>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                               | Description                                    |
| ------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                           | The tenant ID for which to create the entry.   |
| `value`      | [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion) | The value of the entry.                        |
| `namespace?` | `string`                                                                                           | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<LocalListVersion>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                               | Description                                    |
| ------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                           | The tenant ID for which to create the entry.   |
| `value`      | [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion) | The value of the entry.                        |
| `key`        | `string`                                                                                           | The key of the entry.                          |
| `namespace?` | `string`                                                                                           | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateLocalListVersionFromStationIdAndSendLocalList()

```ts
createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
   tenantId,
   stationId,
sendLocalList): Promise<LocalListVersion>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:211](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L211)

Used to process SendLocalListResponse.

###### Parameters

| Parameter       | Type                                                                                      | Description                                                                |
| --------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `tenantId`      | `number`                                                                                  | -                                                                          |
| `stationId`     | `string`                                                                                  | -                                                                          |
| `sendLocalList` | [`SendLocalList`](../layers/sequelize/model/Authorization/SendLocalList.md#sendlocallist) | The SendLocalList object created from the associated SendLocalListRequest. |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>

LocalListVersion - The updated LocalListVersion.

##### createSendLocalListFromRequestData()

```ts
createSendLocalListFromRequestData(
   tenantId,
   stationId,
   correlationId,
   updateType,
   versionNumber,
localAuthorizationList?): Promise<SendLocalList>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:180](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L180)

Creates a SendLocalList.

###### Parameters

| Parameter                 | Type                  | Description                 |
| ------------------------- | --------------------- | --------------------------- |
| `tenantId`                | `number`              | The tenant ID.              |
| `stationId`               | `string`              | The ID of the station.      |
| `correlationId`           | `string`              | The correlation ID.         |
| `updateType`              | `UpdateEnumType`      | The type of update.         |
| `versionNumber`           | `number`              | The version number.         |
| `localAuthorizationList?` | `AuthorizationData`[] | The list of authorizations. |

###### Returns

`Promise`\<[`SendLocalList`](../layers/sequelize/model/Authorization/SendLocalList.md#sendlocallist)\>

The database object. Contains the correlationId to be used for the sendLocalListRequest.

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | LocalListVersion
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                     | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                      | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### getSendLocalListRequestByStationIdAndCorrelationId()

```ts
getSendLocalListRequestByStationIdAndCorrelationId(
   tenantId,
   stationId,
   correlationId): Promise<
  | SendLocalList
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:199](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L199)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `stationId`     | `string` |
| `correlationId` | `string` |

###### Returns

`Promise`\<
\| [`SendLocalList`](../layers/sequelize/model/Authorization/SendLocalList.md#sendlocallist)
\| `undefined`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | LocalListVersion
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | LocalListVersion
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[LocalListVersion, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<LocalListVersion[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | LocalListVersion
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`LocalListVersion`](../layers/sequelize/model/Authorization/LocalListVersion.md#locallistversion)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### validateOrReplaceLocalListVersionForStation()

```ts
validateOrReplaceLocalListVersionForStation(
   tenantId,
   versionNumber,
stationId): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:194](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L194)

Used to process GetLocalListVersionResponse, if version is unknown it will create or update LocalListVersion with the new version and an empty localAuthorizationList.

###### Parameters

| Parameter       | Type     | Description |
| --------------- | -------- | ----------- |
| `tenantId`      | `number` | -           |
| `versionNumber` | `number` | -           |
| `stationId`     | `string` | -           |

###### Returns

`Promise`\<`void`\>

---

### ILocationRepository

Defined in: [01_Data/src/interfaces/repositories.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L218)

#### Extends

- `CrudRepository`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)\>

#### Properties

| Property                                                                                                 | Type                                                                                                                                                                               | Defined in                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="doeschargingstationexistbystationid"></a> `doesChargingStationExistByStationId`                   | (`tenantId`, `stationId`) => `Promise`\<`boolean`\>                                                                                                                                | [01_Data/src/interfaces/repositories.ts:245](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L245) |
| <a id="readchargingstationbystationid"></a> `readChargingStationByStationId`                             | (`tenantId`, `stationId`) => `Promise`\< \| [`ChargingStation`](../layers/sequelize/model/Location/ChargingStation.md#chargingstation) \| `undefined`\>                            | [01_Data/src/interfaces/repositories.ts:220](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L220) |
| <a id="readconnectorbystationidandocpp16connectorid"></a> `readConnectorByStationIdAndOcpp16ConnectorId` | (`tenantId`, `stationId`, `ocpp16ConnectorId`) => `Promise`\< \| [`Connector`](../layers/sequelize/model/Location/Connector.md#connector) \| `undefined`\>                         | [01_Data/src/interfaces/repositories.ts:224](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L224) |
| <a id="readconnectorbystationidandocpp201evsetype"></a> `readConnectorByStationIdAndOcpp201EvseType`     | (`tenantId`, `stationId`, `ocpp201EvseType`) => `Promise`\< \| [`Connector`](../layers/sequelize/model/Location/Connector.md#connector) \| `undefined`\>                           | [01_Data/src/interfaces/repositories.ts:234](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L234) |
| <a id="readevsebystationidandocpp201evseid"></a> `readEvseByStationIdAndOcpp201EvseId`                   | (`tenantId`, `stationId`, `ocpp201EvseId`) => `Promise`\<[`Evse`](../layers/sequelize/model/Location/Evse.md#evse) \| `undefined`\>                                                | [01_Data/src/interfaces/repositories.ts:229](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L229) |
| <a id="readlocationbyid"></a> `readLocationById`                                                         | (`tenantId`, `id`) => `Promise`\< \| [`Location`](../layers/sequelize/model/Location/Location.md#location) \| `undefined`\>                                                        | [01_Data/src/interfaces/repositories.ts:219](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L219) |
| <a id="setchargingstationisonlineandocppversion"></a> `setChargingStationIsOnlineAndOCPPVersion`         | (`tenantId`, `stationId`, `isOnline`, `ocppVersion`) => `Promise`\< \| [`ChargingStation`](../layers/sequelize/model/Location/ChargingStation.md#chargingstation) \| `undefined`\> | [01_Data/src/interfaces/repositories.ts:239](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L239) |

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                |
| `value`      | [`Location`](../layers/sequelize/model/Location/Location.md#location)[] |
| `namespace?` | `string`                                                                |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Location>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `tenantId`   | `number`                                                              |
| `value`      | [`Location`](../layers/sequelize/model/Location/Location.md#location) |
| `namespace?` | `string`                                                              |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Location>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `tenantId`   | `number`                                                              |
| `value`      | [`Location`](../layers/sequelize/model/Location/Location.md#location) |
| `key`        | `string`                                                              |
| `namespace?` | `string`                                                              |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Location
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`Location`](../layers/sequelize/model/Location/Location.md#location)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Location, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Location`](../layers/sequelize/model/Location/Location.md#location), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Location
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`Location`](../layers/sequelize/model/Location/Location.md#location)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### addStatusNotificationToChargingStation()

```ts
addStatusNotificationToChargingStation(
   tenantId,
   stationId,
statusNotification): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:246](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L246)

###### Parameters

| Parameter            | Type                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `tenantId`           | `number`                                                                                            |
| `stationId`          | `string`                                                                                            |
| `statusNotification` | [`StatusNotification`](../layers/sequelize/model/Location/StatusNotification.md#statusnotification) |

###### Returns

`Promise`\<`void`\>

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                    | Description                                      |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                | The tenant ID for which to create the entries.   |
| `values`     | [`Location`](../layers/sequelize/model/Location/Location.md#location)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                   | The class of the model.                          |
| `namespace?` | `string`                                                                | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<Location>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`Location`](../layers/sequelize/model/Location/Location.md#location) | The value of the entry.                        |
| `namespace?` | `string`                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Location>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`Location`](../layers/sequelize/model/Location/Location.md#location) | The value of the entry.                        |
| `key`        | `string`                                                              | The key of the entry.                          |
| `namespace?` | `string`                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateChargingStation()

```ts
createOrUpdateChargingStation(tenantId, chargingStation): Promise<ChargingStation>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:251](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L251)

###### Parameters

| Parameter         | Type                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `tenantId`        | `number`                                                                                   |
| `chargingStation` | [`ChargingStation`](../layers/sequelize/model/Location/ChargingStation.md#chargingstation) |

###### Returns

`Promise`\<[`ChargingStation`](../layers/sequelize/model/Location/ChargingStation.md#chargingstation)\>

##### createOrUpdateConnector()

```ts
createOrUpdateConnector(tenantId, connector): Promise<
  | Connector
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:255](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L255)

###### Parameters

| Parameter   | Type                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| `tenantId`  | `number`                                                                 |
| `connector` | [`Connector`](../layers/sequelize/model/Location/Connector.md#connector) |

###### Returns

`Promise`\<
\| [`Connector`](../layers/sequelize/model/Location/Connector.md#connector)
\| `undefined`\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Location
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`Location`](../layers/sequelize/model/Location/Location.md#location)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                        | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                         | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Location
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`Location`](../layers/sequelize/model/Location/Location.md#location)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | Location
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`Location`](../layers/sequelize/model/Location/Location.md#location)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Location, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Location`](../layers/sequelize/model/Location/Location.md#location), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Location[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Location`](../layers/sequelize/model/Location/Location.md#location)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateAllConnectorsByQuery()

```ts
updateAllConnectorsByQuery(
   tenantId,
   value,
query): Promise<Connector[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:256](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L256)

###### Parameters

| Parameter  | Type                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                              |
| `value`    | `Partial`\<[`Connector`](../layers/sequelize/model/Location/Connector.md#connector)\> |
| `query`    | `object`                                                                              |

###### Returns

`Promise`\<[`Connector`](../layers/sequelize/model/Location/Connector.md#connector)[]\>

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Location
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`Location`](../layers/sequelize/model/Location/Location.md#location)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### updateChargingStationTimestamp()

```ts
updateChargingStationTimestamp(
   tenantId,
   stationId,
timestamp): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:261](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L261)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |
| `timestamp` | `string` |

###### Returns

`Promise`\<`void`\>

---

### IMessageInfoRepository

Defined in: [01_Data/src/interfaces/repositories.ts:401](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L401)

#### Extends

- `CrudRepository`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                            |
| `value`      | [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[] |
| `namespace?` | `string`                                                                            |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<MessageInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                          |
| `value`      | [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo) |
| `namespace?` | `string`                                                                          |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<MessageInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                          |
| `value`      | [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo) |
| `key`        | `string`                                                                          |
| `namespace?` | `string`                                                                          |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | MessageInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[MessageInfo, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | MessageInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                | Description                                      |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                            | The tenant ID for which to create the entries.   |
| `values`     | [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                               | The class of the model.                          |
| `namespace?` | `string`                                                                            | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<MessageInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                              | Description                                    |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo) | The value of the entry.                        |
| `namespace?` | `string`                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<MessageInfo>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                              | Description                                    |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                          | The tenant ID for which to create the entry.   |
| `value`      | [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo) | The value of the entry.                        |
| `key`        | `string`                                                                          | The key of the entry.                          |
| `namespace?` | `string`                                                                          | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateByMessageInfoTypeAndStationId()

```ts
createOrUpdateByMessageInfoTypeAndStationId(
   tenantId,
   value,
   stationId,
componentId?): Promise<MessageInfo>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:403](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L403)

###### Parameters

| Parameter      | Type              |
| -------------- | ----------------- |
| `tenantId`     | `number`          |
| `value`        | `MessageInfoType` |
| `stationId`    | `string`          |
| `componentId?` | `number`          |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>

##### deactivateAllByStationId()

```ts
deactivateAllByStationId(tenantId, stationId): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:402](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L402)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`void`\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | MessageInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                    | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                     | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | MessageInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | MessageInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[MessageInfo, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<MessageInfo[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | MessageInfo
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`MessageInfo`](../layers/sequelize/model/MessageInfo/MessageInfo.md#messageinfo)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IOCPPMessageRepository

Defined in: [01_Data/src/interfaces/repositories.ts:471](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L471)

#### Extends

- `CrudRepository`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                |
| `value`      | [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[] |
| `namespace?` | `string`                                                                |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<OCPPMessage>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `tenantId`   | `number`                                                              |
| `value`      | [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage) |
| `namespace?` | `string`                                                              |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<OCPPMessage>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `tenantId`   | `number`                                                              |
| `value`      | [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage) |
| `key`        | `string`                                                              |
| `namespace?` | `string`                                                              |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[OCPPMessage, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                    | Description                                      |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                | The tenant ID for which to create the entries.   |
| `values`     | [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                   | The class of the model.                          |
| `namespace?` | `string`                                                                | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<OCPPMessage>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage) | The value of the entry.                        |
| `namespace?` | `string`                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<OCPPMessage>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage) | The value of the entry.                        |
| `key`        | `string`                                                              | The key of the entry.                          |
| `namespace?` | `string`                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOCPPMessage()

```ts
createOCPPMessage(tenantId, message): Promise<OCPPMessage>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:472](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L472)

###### Parameters

| Parameter                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tenantId`                                         | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message`                                          | \{ `action`: `string`; `correlationId?`: `string`; `createdAt?`: `Date`; `id?`: `number`; `message`: `any`; `origin`: `MessageOrigin`; `protocol`: `OCPPVersion`; `requestMessage?`: \{ `action`: `string`; `correlationId?`: `string`; `createdAt?`: `Date`; `id?`: `number`; `message`: `any`; `origin`: `MessageOrigin`; `protocol`: `OCPPVersion`; `state`: `MessageState`; `stationId`: `string`; `tenant?`: \{ `countryCode?`: `string` \| `null`; `createdAt?`: `Date`; `id?`: `number`; `isUserTenant`: `boolean`; `name`: `string`; `partyId?`: `string` \| `null`; `serverProfileOCPI?`: \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: ...; `height?`: ...; `type`: ...; `url`: ...; `width?`: ...; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: ...; `url`: ...; \}, `z.core.$strip`\>\>\>; \} \| `null`; `updatedAt?`: `Date`; `url?`: `string` \| `null`; \}; `tenantId?`: `number`; `timestamp`: `string`; `updatedAt?`: `Date`; \}; `requestMessageId?`: `number`; `responseMessages?`: `object`[]; `state`: `MessageState`; `stationId`: `string`; `tenant?`: \{ `countryCode?`: `string` \| `null`; `createdAt?`: `Date`; `id?`: `number`; `isUserTenant`: `boolean`; `name`: `string`; `partyId?`: `string` \| `null`; `serverProfileOCPI?`: \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null`; `updatedAt?`: `Date`; `url?`: `string` \| `null`; \}; `tenantId?`: `number`; `timestamp`: `string`; `updatedAt?`: `Date`; \} |
| `message.action`                                   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.correlationId?`                           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.createdAt?`                               | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.id?`                                      | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.message`                                  | `any`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `message.origin`                                   | `MessageOrigin`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `message.protocol`                                 | `OCPPVersion`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `message.requestMessage?`                          | \{ `action`: `string`; `correlationId?`: `string`; `createdAt?`: `Date`; `id?`: `number`; `message`: `any`; `origin`: `MessageOrigin`; `protocol`: `OCPPVersion`; `state`: `MessageState`; `stationId`: `string`; `tenant?`: \{ `countryCode?`: `string` \| `null`; `createdAt?`: `Date`; `id?`: `number`; `isUserTenant`: `boolean`; `name`: `string`; `partyId?`: `string` \| `null`; `serverProfileOCPI?`: \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: ...; `height?`: ...; `type`: ...; `url`: ...; `width?`: ...; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: ...; `url`: ...; \}, `z.core.$strip`\>\>\>; \} \| `null`; `updatedAt?`: `Date`; `url?`: `string` \| `null`; \}; `tenantId?`: `number`; `timestamp`: `string`; `updatedAt?`: `Date`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `message.requestMessage.action`                    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.correlationId?`            | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.createdAt?`                | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.requestMessage.id?`                       | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.message`                   | `any`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `message.requestMessage.origin`                    | `MessageOrigin`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `message.requestMessage.protocol`                  | `OCPPVersion`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `message.requestMessage.state`                     | `MessageState`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `message.requestMessage.stationId`                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.tenant?`                   | \{ `countryCode?`: `string` \| `null`; `createdAt?`: `Date`; `id?`: `number`; `isUserTenant`: `boolean`; `name`: `string`; `partyId?`: `string` \| `null`; `serverProfileOCPI?`: \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: ...; `height?`: ...; `type`: ...; `url`: ...; `width?`: ...; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: ...; `url`: ...; \}, `z.core.$strip`\>\>\>; \} \| `null`; `updatedAt?`: `Date`; `url?`: `string` \| `null`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.requestMessage.tenant.countryCode?`       | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.requestMessage.tenant.createdAt?`         | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.requestMessage.tenant.id?`                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.tenant.isUserTenant`       | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `message.requestMessage.tenant.name`               | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.tenant.partyId?`           | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.requestMessage.tenant.serverProfileOCPI?` | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: ...; `height?`: ...; `type`: ...; `url`: ...; `width?`: ...; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: ...; `url`: ...; \}, `z.core.$strip`\>\>\>; \} \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `message.requestMessage.tenant.updatedAt?`         | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.requestMessage.tenant.url?`               | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.requestMessage.tenantId?`                 | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.timestamp`                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.requestMessage.updatedAt?`                | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.requestMessageId?`                        | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.responseMessages?`                        | `object`[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `message.state`                                    | `MessageState`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `message.stationId`                                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.tenant?`                                  | \{ `countryCode?`: `string` \| `null`; `createdAt?`: `Date`; `id?`: `number`; `isUserTenant`: `boolean`; `name`: `string`; `partyId?`: `string` \| `null`; `serverProfileOCPI?`: \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null`; `updatedAt?`: `Date`; `url?`: `string` \| `null`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `message.tenant.countryCode?`                      | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.tenant.createdAt?`                        | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.tenant.id?`                               | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.tenant.isUserTenant`                      | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `message.tenant.name`                              | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.tenant.partyId?`                          | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.tenant.serverProfileOCPI?`                | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.tenant.updatedAt?`                        | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `message.tenant.url?`                              | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `message.tenantId?`                                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.timestamp`                                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `message.updatedAt?`                               | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                        | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                         | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### getRequestByCorrelationId()

```ts
getRequestByCorrelationId(tenantId, correlationId): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:473](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L473)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `correlationId` | `string` |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[OCPPMessage, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | OCPPMessage
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`OCPPMessage`](../layers/sequelize/model/OCPPMessage.md#ocppmessage)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IReservationRepository

Defined in: [01_Data/src/interfaces/repositories.ts:462](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L462)

#### Extends

- `CrudRepository`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                |
| `value`      | [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[] |
| `namespace?` | `string`                                                                |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Reservation>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `tenantId`   | `number`                                                              |
| `value`      | [`Reservation`](../layers/sequelize/model/Reservation.md#reservation) |
| `namespace?` | `string`                                                              |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Reservation>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `tenantId`   | `number`                                                              |
| `value`      | [`Reservation`](../layers/sequelize/model/Reservation.md#reservation) |
| `key`        | `string`                                                              |
| `namespace?` | `string`                                                              |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Reservation
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Reservation, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Reservation`](../layers/sequelize/model/Reservation.md#reservation), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Reservation
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                    | Description                                      |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                | The tenant ID for which to create the entries.   |
| `values`     | [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                   | The class of the model.                          |
| `namespace?` | `string`                                                                | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<Reservation>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`Reservation`](../layers/sequelize/model/Reservation.md#reservation) | The value of the entry.                        |
| `namespace?` | `string`                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Reservation>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                  | Description                                    |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`Reservation`](../layers/sequelize/model/Reservation.md#reservation) | The value of the entry.                        |
| `key`        | `string`                                                              | The key of the entry.                          |
| `namespace?` | `string`                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createOrUpdateReservation()

```ts
createOrUpdateReservation(
   tenantId,
   reserveNowRequest,
   stationId,
   isActive?): Promise<
  | Reservation
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:463](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L463)

###### Parameters

| Parameter           | Type                |
| ------------------- | ------------------- |
| `tenantId`          | `number`            |
| `reserveNowRequest` | `ReserveNowRequest` |
| `stationId`         | `string`            |
| `isActive?`         | `boolean`           |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Reservation
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                        | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                         | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Reservation
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | Reservation
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Reservation, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Reservation`](../layers/sequelize/model/Reservation.md#reservation), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Reservation[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Reservation`](../layers/sequelize/model/Reservation.md#reservation)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Reservation
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`Reservation`](../layers/sequelize/model/Reservation.md#reservation)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### ISecurityEventRepository

Defined in: [01_Data/src/interfaces/repositories.ts:268](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L268)

#### Extends

- `CrudRepository`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>

#### Properties

| Property                                                                 | Type                                                                                                                                    | Description                                 | Overrides                    | Defined in                                                                                                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="createbystationid"></a> `createByStationId`                       | (`tenantId`, `value`, `stationId`) => `Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>          | -                                           | -                            | [01_Data/src/interfaces/repositories.ts:269](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L269) |
| <a id="deletebykey-16"></a> `deleteByKey`                                | (`tenantId`, `key`) => `Promise`\< \| [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent) \| `undefined`\>      | Deletes a key from the specified namespace. | `CrudRepository.deleteByKey` | [01_Data/src/interfaces/repositories.ts:280](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L280) |
| <a id="readbystationidandtimestamps"></a> `readByStationIdAndTimestamps` | (`tenantId`, `stationId`, `from?`, `to?`) => `Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\> | -                                           | -                            | [01_Data/src/interfaces/repositories.ts:274](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L274) |

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                      |
| `value`      | [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[] |
| `namespace?` | `string`                                                                      |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<SecurityEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                    |
| `value`      | [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent) |
| `namespace?` | `string`                                                                    |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<SecurityEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                    |
| `value`      | [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent) |
| `key`        | `string`                                                                    |
| `namespace?` | `string`                                                                    |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | SecurityEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[SecurityEvent, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | SecurityEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                          | Description                                      |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                      | The tenant ID for which to create the entries.   |
| `values`     | [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                         | The class of the model.                          |
| `namespace?` | `string`                                                                      | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<SecurityEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                        | Description                                    |
| ------------ | --------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                    | The tenant ID for which to create the entry.   |
| `value`      | [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent) | The value of the entry.                        |
| `namespace?` | `string`                                                                    | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<SecurityEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                        | Description                                    |
| ------------ | --------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                    | The tenant ID for which to create the entry.   |
| `value`      | [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent) | The value of the entry.                        |
| `key`        | `string`                                                                    | The key of the entry.                          |
| `namespace?` | `string`                                                                    | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                              | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                               | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | SecurityEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | SecurityEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[SecurityEvent, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<SecurityEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | SecurityEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`SecurityEvent`](../layers/sequelize/model/SecurityEvent.md#securityevent)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### IServerNetworkProfileRepository

Defined in: [01_Data/src/interfaces/repositories.ts:498](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L498)

#### Extends

- `CrudRepository`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                    |
| `value`      | [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[] |
| `namespace?` | `string`                                                                                                    |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<ServerNetworkProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                  |
| `value`      | [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile) |
| `namespace?` | `string`                                                                                                  |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ServerNetworkProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                  |
| `value`      | [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile) |
| `key`        | `string`                                                                                                  |
| `namespace?` | `string`                                                                                                  |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ServerNetworkProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ServerNetworkProfile, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ServerNetworkProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                        | Description                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                    | The tenant ID for which to create the entries.   |
| `values`     | [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                       | The class of the model.                          |
| `namespace?` | `string`                                                                                                    | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<ServerNetworkProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                      | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                  | The tenant ID for which to create the entry.   |
| `value`      | [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                  | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<ServerNetworkProfile>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                      | Description                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                  | The tenant ID for which to create the entry.   |
| `value`      | [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile) | The value of the entry.                        |
| `key`        | `string`                                                                                                  | The key of the entry.                          |
| `namespace?` | `string`                                                                                                  | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ServerNetworkProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                            | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                             | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | ServerNetworkProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | ServerNetworkProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[ServerNetworkProfile, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<ServerNetworkProfile[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | ServerNetworkProfile
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### upsertServerNetworkProfile()

```ts
upsertServerNetworkProfile(websocketServerConfig, maxCallLengthSeconds): Promise<ServerNetworkProfile>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:499](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L499)

###### Parameters

| Parameter               | Type     |
| ----------------------- | -------- |
| `websocketServerConfig` | `any`    |
| `maxCallLengthSeconds`  | `number` |

###### Returns

`Promise`\<[`ServerNetworkProfile`](../layers/sequelize/model/Location/ServerNetworkProfile.md#servernetworkprofile)\>

---

### ISubscriptionRepository

Defined in: [01_Data/src/interfaces/repositories.ts:283](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L283)

#### Extends

- `CrudRepository`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                    |
| ------------ | --------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                |
| `value`      | [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[] |
| `namespace?` | `string`                                                                                |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Subscription>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                              |
| `value`      | [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription) |
| `namespace?` | `string`                                                                              |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Subscription>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                              |
| `value`      | [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription) |
| `key`        | `string`                                                                              |
| `namespace?` | `string`                                                                              |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Subscription
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Subscription, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Subscription
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                    | Description                                      |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                | The tenant ID for which to create the entries.   |
| `values`     | [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                   | The class of the model.                          |
| `namespace?` | `string`                                                                                | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(tenantId, value): Promise<Subscription>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:284](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L284)

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter  | Type                                                                                  | Description                                  |
| ---------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| `tenantId` | `number`                                                                              | The tenant ID for which to create the entry. |
| `value`    | [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription) | The value of the entry.                      |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)\>

A Promise that resolves to the created entry.

###### Overrides

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Subscription>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                  | Description                                    |
| ------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription) | The value of the entry.                        |
| `key`        | `string`                                                                              | The key of the entry.                          |
| `namespace?` | `string`                                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(tenantId, key): Promise<
  | Subscription
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:286](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L286)

Deletes a key from the specified namespace.

###### Parameters

| Parameter  | Type     | Description                                  |
| ---------- | -------- | -------------------------------------------- |
| `tenantId` | `number` | The tenant ID for which to delete the entry. |
| `key`      | `string` | The key to delete.                           |

###### Returns

`Promise`\<
\| [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Overrides

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                        | Description                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                         | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readAllByStationId()

```ts
readAllByStationId(tenantId, stationId): Promise<Subscription[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:285](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L285)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Subscription
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | Subscription
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Subscription, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Subscription[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Subscription
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`Subscription`](../layers/sequelize/model/Subscription/Subscription.md#subscription)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### ITariffRepository

Defined in: [01_Data/src/interfaces/repositories.ts:411](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L411)

#### Extends

- `CrudRepository`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                             |
| ------------ | ---------------------------------------------------------------- |
| `tenantId`   | `number`                                                         |
| `value`      | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[] |
| `namespace?` | `string`                                                         |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Tariff>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                           |
| ------------ | -------------------------------------------------------------- |
| `tenantId`   | `number`                                                       |
| `value`      | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff) |
| `namespace?` | `string`                                                       |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Tariff>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                           |
| ------------ | -------------------------------------------------------------- |
| `tenantId`   | `number`                                                       |
| `value`      | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff) |
| `key`        | `string`                                                       |
| `namespace?` | `string`                                                       |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Tariff
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Tariff, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Tariff
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                             | Description                                      |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                         | The tenant ID for which to create the entries.   |
| `values`     | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[] | The values of the entries.                       |
| `clazz`      | `any`                                                            | The class of the model.                          |
| `namespace?` | `string`                                                         | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<Tariff>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                           | Description                                    |
| ------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                       | The tenant ID for which to create the entry.   |
| `value`      | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff) | The value of the entry.                        |
| `namespace?` | `string`                                                       | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Tariff>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                           | Description                                    |
| ------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                       | The tenant ID for which to create the entry.   |
| `value`      | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff) | The value of the entry.                        |
| `key`        | `string`                                                       | The key of the entry.                          |
| `namespace?` | `string`                                                       | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteAllByQuerystring()

```ts
deleteAllByQuerystring(tenantId, query): Promise<Tariff[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:414](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L414)

###### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `tenantId` | `number`                                                   |
| `query`    | [`TariffQueryString`](queries/Tariff.md#tariffquerystring) |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Tariff
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                 | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                  | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### findByConnectorId()

```ts
findByConnectorId(tenantId, connectorId): Promise<
  | Tariff
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:412](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L412)

###### Parameters

| Parameter     | Type     |
| ------------- | -------- |
| `tenantId`    | `number` |
| `connectorId` | `number` |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readAllByQuerystring()

```ts
readAllByQuerystring(tenantId, query): Promise<Tariff[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:413](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L413)

###### Parameters

| Parameter  | Type                                                       |
| ---------- | ---------------------------------------------------------- |
| `tenantId` | `number`                                                   |
| `query`    | [`TariffQueryString`](queries/Tariff.md#tariffquerystring) |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | Tariff
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | Tariff
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Tariff, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Tariff[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | Tariff
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### upsertTariff()

```ts
upsertTariff(tenantId, tariff): Promise<Tariff>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:415](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L415)

###### Parameters

| Parameter  | Type                                                           |
| ---------- | -------------------------------------------------------------- |
| `tenantId` | `number`                                                       |
| `tariff`   | [`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff) |

###### Returns

`Promise`\<[`Tariff`](../layers/sequelize/model/Tariff/Tariffs.md#tariff)\>

---

### ITenantRepository

Defined in: [01_Data/src/interfaces/repositories.ts:512](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L512)

#### Extends

- `CrudRepository`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                     |
| ------------ | -------------------------------------------------------- |
| `tenantId`   | `number`                                                 |
| `value`      | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[] |
| `namespace?` | `string`                                                 |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<Tenant>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                   |
| ------------ | ------------------------------------------------------ |
| `tenantId`   | `number`                                               |
| `value`      | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant) |
| `namespace?` | `string`                                               |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Tenant>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                   |
| ------------ | ------------------------------------------------------ |
| `tenantId`   | `number`                                               |
| `value`      | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant) |
| `key`        | `string`                                               |
| `namespace?` | `string`                                               |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
namespace?): Promise<Tenant | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant) \| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Tenant, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`Tenant`](../layers/sequelize/model/Tenant.md#tenant), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Tenant | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant) \| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                     | Description                                      |
| ------------ | -------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                 | The tenant ID for which to create the entries.   |
| `values`     | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[] | The values of the entries.                       |
| `clazz`      | `any`                                                    | The class of the model.                          |
| `namespace?` | `string`                                                 | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<Tenant>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                   | Description                                    |
| ------------ | ------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                               | The tenant ID for which to create the entry.   |
| `value`      | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant) | The value of the entry.                        |
| `namespace?` | `string`                                               | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Tenant>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                   | Description                                    |
| ------------ | ------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                               | The tenant ID for which to create the entry.   |
| `value`      | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant) | The value of the entry.                        |
| `key`        | `string`                                               | The key of the entry.                          |
| `namespace?` | `string`                                               | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createTenant()

```ts
createTenant(tenant): Promise<Tenant>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:513](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L513)

###### Parameters

| Parameter | Type                                                   |
| --------- | ------------------------------------------------------ |
| `tenant`  | [`Tenant`](../layers/sequelize/model/Tenant.md#tenant) |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
namespace?): Promise<Tenant | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant) \| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                         | Description                                                                                                   |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                          | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
namespace?): Promise<Tenant | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant) \| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
namespace?): Promise<Tenant | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant) \| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Tenant, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`Tenant`](../layers/sequelize/model/Tenant.md#tenant), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Tenant[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Tenant | undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<[`Tenant`](../layers/sequelize/model/Tenant.md#tenant) \| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

---

### ITransactionEventRepository

Defined in: [01_Data/src/interfaces/repositories.ts:289](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L289)

#### Extends

- `CrudRepository`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                |
| `value`      | [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[] |
| `namespace?` | `string`                                                                                                |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<TransactionEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                              |
| `value`      | [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent) |
| `namespace?` | `string`                                                                                              |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<TransactionEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                              |
| `value`      | [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent) |
| `key`        | `string`                                                                                              |
| `namespace?` | `string`                                                                                              |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | TransactionEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[TransactionEvent, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | TransactionEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                    | Description                                      |
| ------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                | The tenant ID for which to create the entries.   |
| `values`     | [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                   | The class of the model.                          |
| `namespace?` | `string`                                                                                                | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<TransactionEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                  | Description                                    |
| ------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent) | The value of the entry.                        |
| `namespace?` | `string`                                                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<TransactionEvent>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                  | Description                                    |
| ------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                              | The tenant ID for which to create the entry.   |
| `value`      | [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent) | The value of the entry.                        |
| `key`        | `string`                                                                                              | The key of the entry.                          |
| `namespace?` | `string`                                                                                              | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createMeterValue()

```ts
createMeterValue(
   tenantId,
   value,
   transactionDatabaseId?,
   transactionId?,
tariffId?): Promise<MeterValue>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:295](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L295)

###### Parameters

| Parameter                | Type               |
| ------------------------ | ------------------ |
| `tenantId`               | `number`           |
| `value`                  | `MeterValueType`   |
| `transactionDatabaseId?` | `number` \| `null` |
| `transactionId?`         | `string` \| `null` |
| `tariffId?`              | `number` \| `null` |

###### Returns

`Promise`\<[`MeterValue`](../layers/sequelize/model/TransactionEvent/MeterValue.md#metervalue)\>

##### createOrUpdateTransactionByTransactionEventAndStationId()

```ts
createOrUpdateTransactionByTransactionEventAndStationId(
   tenantId,
   value,
stationId): Promise<Transaction>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:290](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L290)

###### Parameters

| Parameter   | Type                      |
| ----------- | ------------------------- |
| `tenantId`  | `number`                  |
| `value`     | `TransactionEventRequest` |
| `stationId` | `string`                  |

###### Returns

`Promise`\<[`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)\>

##### createStopTransaction()

```ts
createStopTransaction(
   tenantId,
   transactionDatabaseId,
   stationId,
   meterStop,
   timestamp,
   meterValues,
   reason?,
idTokenDatabaseId?): Promise<StopTransaction>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:343](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L343)

###### Parameters

| Parameter               | Type       |
| ----------------------- | ---------- |
| `tenantId`              | `number`   |
| `transactionDatabaseId` | `number`   |
| `stationId`             | `string`   |
| `meterStop`             | `number`   |
| `timestamp`             | `Date`     |
| `meterValues`           | `object`[] |
| `reason?`               | `string`   |
| `idTokenDatabaseId?`    | `number`   |

###### Returns

`Promise`\<[`StopTransaction`](../layers/sequelize/model/TransactionEvent/StopTransaction.md#stoptransaction)\>

##### createTransactionByStartTransaction()

```ts
createTransactionByStartTransaction(
   tenantId,
   request,
stationId): Promise<Transaction>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:302](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L302)

###### Parameters

| Parameter   | Type                      |
| ----------- | ------------------------- |
| `tenantId`  | `number`                  |
| `request`   | `StartTransactionRequest` |
| `stationId` | `string`                  |

###### Returns

`Promise`\<[`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | TransactionEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                        | Description                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                         | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### getActiveTransactionByStationIdAndEvseId()

```ts
getActiveTransactionByStationIdAndEvseId(
   tenantId,
   stationId,
   evseId): Promise<
  | Transaction
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:337](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L337)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |
| `evseId`    | `number` |

###### Returns

`Promise`\<
\| [`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllActiveTransactionsByAuthorizationId()

```ts
readAllActiveTransactionsByAuthorizationId(tenantId, authorizationId): Promise<Transaction[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:329](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L329)

###### Parameters

| Parameter         | Type     |
| ----------------- | -------- |
| `tenantId`        | `number` |
| `authorizationId` | `number` |

###### Returns

`Promise`\<[`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)[]\>

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readAllByStationIdAndTransactionId()

```ts
readAllByStationIdAndTransactionId(
   tenantId,
   stationId,
transactionId): Promise<TransactionEvent[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:313](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L313)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `stationId`     | `string` |
| `transactionId` | `string` |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

##### readAllMeterValuesByTransactionDataBaseId()

```ts
readAllMeterValuesByTransactionDataBaseId(tenantId, transactionDataBaseId): Promise<MeterValue[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:333](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L333)

###### Parameters

| Parameter               | Type     |
| ----------------------- | -------- |
| `tenantId`              | `number` |
| `transactionDataBaseId` | `number` |

###### Returns

`Promise`\<[`MeterValue`](../layers/sequelize/model/TransactionEvent/MeterValue.md#metervalue)[]\>

##### readAllTransactionsByStationIdAndEvseAndChargingStates()

```ts
readAllTransactionsByStationIdAndEvseAndChargingStates(
   tenantId,
   stationId,
   evse,
chargingStates?): Promise<Transaction[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:323](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L323)

###### Parameters

| Parameter         | Type                      |
| ----------------- | ------------------------- |
| `tenantId`        | `number`                  |
| `stationId`       | `string`                  |
| `evse`            | `EVSEType`                |
| `chargingStates?` | `ChargingStateEnumType`[] |

###### Returns

`Promise`\<[`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)[]\>

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | TransactionEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | TransactionEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[TransactionEvent, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### readTransactionByStationIdAndTransactionId()

```ts
readTransactionByStationIdAndTransactionId(
   tenantId,
   stationId,
   transactionId): Promise<
  | Transaction
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:318](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L318)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `stationId`     | `string` |
| `transactionId` | `string` |

###### Returns

`Promise`\<
\| [`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | TransactionEvent
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`TransactionEvent`](../layers/sequelize/model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### updateTransactionByMeterValues()

```ts
updateTransactionByMeterValues(
   tenantId,
   meterValues,
   stationId,
transactionId): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:307](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L307)

###### Parameters

| Parameter       | Type       |
| --------------- | ---------- |
| `tenantId`      | `number`   |
| `meterValues`   | `object`[] |
| `stationId`     | `string`   |
| `transactionId` | `number`   |

###### Returns

`Promise`\<`void`\>

##### updateTransactionByStationIdAndTransactionId()

```ts
updateTransactionByStationIdAndTransactionId(
   tenantId,
   transaction,
   transactionId,
   stationId): Promise<
  | Transaction
| undefined>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:353](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L353)

###### Parameters

| Parameter       | Type                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `tenantId`      | `number`                                                                                            |
| `transaction`   | `Partial`\<[`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)\> |
| `transactionId` | `string`                                                                                            |
| `stationId`     | `string`                                                                                            |

###### Returns

`Promise`\<
\| [`Transaction`](../layers/sequelize/model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

##### updateTransactionTotalCostById()

```ts
updateTransactionTotalCostById(
   tenantId,
   totalCost,
id): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:342](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L342)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `totalCost` | `number` |
| `id`        | `number` |

###### Returns

`Promise`\<`void`\>

---

### IVariableMonitoringRepository

Defined in: [01_Data/src/interfaces/repositories.ts:361](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L361)

#### Extends

- `CrudRepository`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>

#### Methods

##### \_bulkCreate()

```ts
abstract protected _bulkCreate(
   tenantId,
   value,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:163

###### Parameters

| Parameter    | Type                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                        |
| `value`      | [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[] |
| `namespace?` | `string`                                                                                                        |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

###### Inherited from

```ts
CrudRepository._bulkCreate;
```

##### \_create()

```ts
abstract protected _create(
   tenantId,
   value,
namespace?): Promise<VariableMonitoring>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:162

###### Parameters

| Parameter    | Type                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                      |
| `value`      | [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring) |
| `namespace?` | `string`                                                                                                      |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>

###### Inherited from

```ts
CrudRepository._create;
```

##### \_createByKey()

```ts
abstract protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableMonitoring>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:164

###### Parameters

| Parameter    | Type                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                                                      |
| `value`      | [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring) |
| `key`        | `string`                                                                                                      |
| `namespace?` | `string`                                                                                                      |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>

###### Inherited from

```ts
CrudRepository._createByKey;
```

##### \_deleteAllByQuery()

```ts
abstract protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:169

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

###### Inherited from

```ts
CrudRepository._deleteAllByQuery;
```

##### \_deleteByKey()

```ts
abstract protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | VariableMonitoring
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:168

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `key`        | `string` |
| `namespace?` | `string` |

###### Returns

`Promise`\<
\| [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._deleteByKey;
```

##### \_readOrCreateByQuery()

```ts
abstract protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[VariableMonitoring, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:165

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `query`      | `object` |
| `namespace?` | `string` |

###### Returns

`Promise`\<\[[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring), `boolean`\]\>

###### Inherited from

```ts
CrudRepository._readOrCreateByQuery;
```

##### \_updateAllByQuery()

```ts
abstract protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:167

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `query`      | `object`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

###### Inherited from

```ts
CrudRepository._updateAllByQuery;
```

##### \_updateByKey()

```ts
abstract protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | VariableMonitoring
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:166

###### Parameters

| Parameter    | Type             |
| ------------ | ---------------- |
| `tenantId`   | `number`         |
| `value`      | `Partial`\<`T`\> |
| `key`        | `string`         |
| `namespace?` | `string`         |

###### Returns

`Promise`\<
\| [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)
\| `undefined`\>

###### Inherited from

```ts
CrudRepository._updateByKey;
```

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                                            | Description                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                                                        | The tenant ID for which to create the entries.   |
| `values`     | [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                                           | The class of the model.                          |
| `namespace?` | `string`                                                                                                        | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

A Promise that resolves to the created entries.

###### Inherited from

```ts
CrudRepository.bulkCreate;
```

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<VariableMonitoring>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                                                          | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                      | The tenant ID for which to create the entry.   |
| `value`      | [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring) | The value of the entry.                        |
| `namespace?` | `string`                                                                                                      | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.create;
```

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableMonitoring>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                                                          | Description                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                                                      | The tenant ID for which to create the entry.   |
| `value`      | [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring) | The value of the entry.                        |
| `key`        | `string`                                                                                                      | The key of the entry.                          |
| `namespace?` | `string`                                                                                                      | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>

A Promise that resolves to the created entry.

###### Inherited from

```ts
CrudRepository.createByKey;
```

##### createEventDatumByComponentIdAndVariableIdAndStationId()

```ts
createEventDatumByComponentIdAndVariableIdAndStationId(
   tenantId,
   event,
   componentId,
   variableId,
stationId): Promise<EventData>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:392](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L392)

###### Parameters

| Parameter     | Type            |
| ------------- | --------------- |
| `tenantId`    | `number`        |
| `event`       | `EventDataType` |
| `componentId` | `string`        |
| `variableId`  | `string`        |
| `stationId`   | `string`        |

###### Returns

`Promise`\<[`EventData`](../layers/sequelize/model/VariableMonitoring/EventData.md#eventdata)\>

##### createOrUpdateByMonitoringDataTypeAndStationId()

```ts
createOrUpdateByMonitoringDataTypeAndStationId(
   tenantId,
   value,
   componentId,
   variableId,
stationId): Promise<VariableMonitoring[]>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:362](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L362)

###### Parameters

| Parameter     | Type                 |
| ------------- | -------------------- |
| `tenantId`    | `number`             |
| `value`       | `MonitoringDataType` |
| `componentId` | `string`             |
| `variableId`  | `string`             |
| `stationId`   | `string`             |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

##### createOrUpdateBySetMonitoringDataTypeAndStationId()

```ts
createOrUpdateBySetMonitoringDataTypeAndStationId(
   tenantId,
   value,
   componentId,
   variableId,
stationId): Promise<VariableMonitoring>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:369](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L369)

###### Parameters

| Parameter     | Type                    |
| ------------- | ----------------------- |
| `tenantId`    | `number`                |
| `value`       | `SetMonitoringDataType` |
| `componentId` | `string`                |
| `variableId`  | `string`                |
| `stationId`   | `string`                |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:114

Deletes all values associated with a query from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                              |
| ------------ | -------- | -------------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entries.           |
| `query`      | `object` | The query to use.                                        |
| `namespace?` | `string` | Optional. The namespace from which to delete the values. |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

```ts
CrudRepository.deleteAllByQuery;
```

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | VariableMonitoring
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:105

Deletes a key from the specified namespace.

###### Parameters

| Parameter    | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to delete the entry.          |
| `key`        | `string` | The key to delete.                                    |
| `namespace?` | `string` | Optional. The namespace from which to delete the key. |

###### Returns

`Promise`\<
\| [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

```ts
CrudRepository.deleteByKey;
```

##### emit()

```ts
emit<K>(event, ...args): boolean;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:29

Emit method overridden to emit events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter | Type                                                                                                                                | Description                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                                                 | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

```ts
CrudRepository.emit;
```

##### existByQuery()

```ts
abstract existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:161

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

###### Inherited from

```ts
CrudRepository.existByQuery;
```

##### existsByKey()

```ts
abstract existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:152

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

###### Inherited from

```ts
CrudRepository.existsByKey;
```

##### on()

```ts
on<K>(event, listener): this;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:21

On method overridden to handle events from CrudEvent.

###### Type Parameters

| Type Parameter                         |
| -------------------------------------- |
| `K` _extends_ keyof `CrudEvent`\<`T`\> |

###### Parameters

| Parameter  | Type                  | Description                                                                                          |
| ---------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `event`    | `K`                   | The name of the event. Must be a key in CrudEvent.                                                   |
| `listener` | (...`args`) => `void` | The callback for the event. Argument types correspond to the contents of the event key in CrudEvent. |

###### Returns

`this`

###### See

EventEmitter#on for the original method.

###### Inherited from

```ts
CrudRepository.on;
```

##### readAllByQuery()

```ts
abstract readAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:132

Reads values from storage based on the given query.

###### Parameters

| Parameter    | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read the entries. |
| `query`      | `object` | The query to use.                            |
| `namespace?` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

```ts
CrudRepository.readAllByQuery;
```

##### readByKey()

```ts
abstract readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | VariableMonitoring
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:123

Reads a value from storage based on the given key.

###### Parameters

| Parameter    | Type                 | Description                                |
| ------------ | -------------------- | ------------------------------------------ |
| `tenantId`   | `number`             | The tenant ID for which to read the entry. |
| `key`        | `string` \| `number` | The key to look up in storage.             |
| `namespace?` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.readByKey;
```

##### readNextValue()

```ts
abstract readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:143

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

###### Inherited from

```ts
CrudRepository.readNextValue;
```

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | VariableMonitoring
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:67

Attempts to read a value from storage based on the given query, or throws an exception if more than one value is found.

###### Parameters

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `tenantId`   | `number` | The tenant ID for which to read the entry. |
| `query`      | `object` | The query to use.                          |
| `namespace?` | `string` | Optional namespace for the query.          |

###### Returns

`Promise`\<
\| [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

```ts
CrudRepository.readOnlyOneByQuery;
```

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[VariableMonitoring, boolean]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:76

Reads the first matching value from storage based on the given query, or creates a matching value if none exists.

###### Parameters

| Parameter    | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `tenantId`   | `number` | The tenant ID for which to read or create the entry. |
| `query`      | `object` | The query to use.                                    |
| `namespace?` | `string` | Optional namespace for the query.                    |

###### Returns

`Promise`\<\[[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

```ts
CrudRepository.readOrCreateByQuery;
```

##### rejectAllVariableMonitoringsByStationId()

```ts
rejectAllVariableMonitoringsByStationId(
   tenantId,
   action,
stationId): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:376](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L376)

###### Parameters

| Parameter   | Type         |
| ----------- | ------------ |
| `tenantId`  | `number`     |
| `action`    | `CallAction` |
| `stationId` | `string`     |

###### Returns

`Promise`\<`void`\>

##### rejectVariableMonitoringByIdAndStationId()

```ts
rejectVariableMonitoringByIdAndStationId(
   tenantId,
   action,
   id,
stationId): Promise<void>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:381](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L381)

###### Parameters

| Parameter   | Type         |
| ----------- | ------------ |
| `tenantId`  | `number`     |
| `action`    | `CallAction` |
| `id`        | `number`     |
| `stationId` | `string`     |

###### Returns

`Promise`\<`void`\>

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<VariableMonitoring[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:96

Updates the values associated with the given query.

###### Parameters

| Parameter    | Type             | Description                                    |
| ------------ | ---------------- | ---------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entries. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the query.     |
| `query`      | `object`         | The query to use.                              |
| `namespace?` | `string`         | Optional namespace for the query.              |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

```ts
CrudRepository.updateAllByQuery;
```

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | VariableMonitoring
| undefined>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:86

Updates the value associated with the given key.

###### Parameters

| Parameter    | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `tenantId`   | `number`         | The tenant ID for which to update the entry. |
| `value`      | `Partial`\<`T`\> | The new value to associate with the key.     |
| `key`        | `string`         | The key to update.                           |
| `namespace?` | `string`         | The namespace in which to update the key.    |

###### Returns

`Promise`\<
\| [`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

```ts
CrudRepository.updateByKey;
```

##### updateResultByStationId()

```ts
updateResultByStationId(
   tenantId,
   result,
stationId): Promise<VariableMonitoring>;
```

Defined in: [01_Data/src/interfaces/repositories.ts:387](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/repositories.ts#L387)

###### Parameters

| Parameter   | Type                      |
| ----------- | ------------------------- |
| `tenantId`  | `number`                  |
| `result`    | `SetMonitoringResultType` |
| `stationId` | `string`                  |

###### Returns

`Promise`\<[`VariableMonitoring`](../layers/sequelize/model/VariableMonitoring/VariableMonitoring.md#variablemonitoring)\>
