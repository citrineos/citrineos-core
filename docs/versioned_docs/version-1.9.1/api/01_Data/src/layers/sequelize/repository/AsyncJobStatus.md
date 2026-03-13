[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/repository/AsyncJobStatus

# 01_Data/src/layers/sequelize/repository/AsyncJobStatus

## Classes

### SequelizeAsyncJobStatusRepository

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L13)

#### Extends

- [`SequelizeRepository`](Base.md#sequelizerepository)\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

#### Constructors

##### Constructor

```ts
new SequelizeAsyncJobStatusRepository(
   config,
   logger?,
   sequelizeInstance?): SequelizeAsyncJobStatusRepository;
```

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L14)

###### Parameters

| Parameter                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`                                   | \{ `configDir?`: `string`; `configFileName`: `string`; `database`: \{ `alter`: `boolean`; `database`: `string`; `dialect`: `string`; `force`: `boolean`; `host`: `string`; `maxRetries`: `number`; `password`: `string`; `pool?`: \{ `acquire?`: `number`; `idle?`: `number`; `max?`: `number`; `min?`: `number`; \}; `port`: `number`; `retryDelay`: `number`; `sync`: `boolean`; `username`: `string`; \}; `fileAccess`: \{ `gcp?`: \{ `credentials?`: `Record`\<`string`, `never`\>; `projectId`: `string`; \}; `local?`: \{ `defaultFilePath`: `string`; \}; `s3?`: \{ `accessKeyId?`: `string`; `defaultBucketName`: `string`; `endpoint?`: `string`; `region?`: `string`; `s3ForcePathStyle`: `boolean`; `secretAccessKey?`: `string`; \}; `type`: `"local"` \| `"s3"` \| `"gcp"`; \}; \} |
| `config.configDir?`                        | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.configFileName?`                   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database?`                         | \{ `alter`: `boolean`; `database`: `string`; `dialect`: `string`; `force`: `boolean`; `host`: `string`; `maxRetries`: `number`; `password`: `string`; `pool?`: \{ `acquire?`: `number`; `idle?`: `number`; `max?`: `number`; `min?`: `number`; \}; `port`: `number`; `retryDelay`: `number`; `sync`: `boolean`; `username`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.alter?`                   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `config.database.database?`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.dialect?`                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.force?`                   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `config.database.host?`                    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.maxRetries?`              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.password?`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.pool?`                    | \{ `acquire?`: `number`; `idle?`: `number`; `max?`: `number`; `min?`: `number`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `config.database.pool.acquire?`            | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.pool.idle?`               | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.pool.max?`                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.pool.min?`                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.port?`                    | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.retryDelay?`              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.database.sync?`                    | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `config.database.username?`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess?`                       | \{ `gcp?`: \{ `credentials?`: `Record`\<`string`, `never`\>; `projectId`: `string`; \}; `local?`: \{ `defaultFilePath`: `string`; \}; `s3?`: \{ `accessKeyId?`: `string`; `defaultBucketName`: `string`; `endpoint?`: `string`; `region?`: `string`; `s3ForcePathStyle`: `boolean`; `secretAccessKey?`: `string`; \}; `type`: `"local"` \| `"s3"` \| `"gcp"`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `config.fileAccess.gcp?`                   | \{ `credentials?`: `Record`\<`string`, `never`\>; `projectId`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `config.fileAccess.gcp.credentials?`       | `Record`\<`string`, `never`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `config.fileAccess.gcp.projectId?`         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.local?`                 | \{ `defaultFilePath`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `config.fileAccess.local.defaultFilePath?` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.s3?`                    | \{ `accessKeyId?`: `string`; `defaultBucketName`: `string`; `endpoint?`: `string`; `region?`: `string`; `s3ForcePathStyle`: `boolean`; `secretAccessKey?`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `config.fileAccess.s3.accessKeyId?`        | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.s3.defaultBucketName?`  | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.s3.endpoint?`           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.s3.region?`             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.s3.s3ForcePathStyle?`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `config.fileAccess.s3.secretAccessKey?`    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `config.fileAccess.type?`                  | `"local"` \| `"s3"` \| `"gcp"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `logger?`                                  | `Logger`\<`ILogObj`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `sequelizeInstance?`                       | `Sequelize`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

###### Returns

[`SequelizeAsyncJobStatusRepository`](#sequelizeasyncjobstatusrepository)

###### Overrides

[`SequelizeRepository`](Base.md#sequelizerepository).[`constructor`](Base.md#constructor)

#### Properties

| Property                           | Modifier    | Type                  | Inherited from                                                                        | Defined in                                                                                                                                                                                          |
| ---------------------------------- | ----------- | --------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="logger"></a> `logger`       | `protected` | `Logger`\<`ILogObj`\> | [`SequelizeRepository`](Base.md#sequelizerepository).[`logger`](Base.md#logger)       | [01_Data/src/layers/sequelize/repository/Base.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L22) |
| <a id="namespace"></a> `namespace` | `protected` | `string`              | [`SequelizeRepository`](Base.md#sequelizerepository).[`namespace`](Base.md#namespace) | [01_Data/src/layers/sequelize/repository/Base.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L21) |
| <a id="s"></a> `s`                 | `protected` | `Sequelize`           | [`SequelizeRepository`](Base.md#sequelizerepository).[`s`](Base.md#s)                 | [01_Data/src/layers/sequelize/repository/Base.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L20) |

#### Methods

##### \_bulkCreate()

```ts
protected _bulkCreate(
   tenantId,
   values,
namespace?): Promise<AsyncJobStatus[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L115)

###### Parameters

| Parameter   | Type                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| `tenantId`  | `number`                                                                 |
| `values`    | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[] |
| `namespace` | `string`                                                                 |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_bulkCreate`](Base.md#_bulkcreate)

##### \_create()

```ts
protected _create(
   tenantId,
   value,
_namespace?): Promise<AsyncJobStatus>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L107)

###### Parameters

| Parameter    | Type                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| `tenantId`   | `number`                                                               |
| `value`      | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus) |
| `_namespace` | `string`                                                               |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_create`](Base.md#_create)

##### \_createByKey()

```ts
protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<AsyncJobStatus>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L123)

###### Parameters

| Parameter   | Type                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| `tenantId`  | `number`                                                               |
| `value`     | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus) |
| `key`       | `string`                                                               |
| `namespace` | `string`                                                               |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_createByKey`](Base.md#_createbykey)

##### \_deleteAllByQuery()

```ts
protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<AsyncJobStatus[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L218)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteAllByQuery`](Base.md#_deleteallbyquery)

##### \_deleteByKey()

```ts
protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | AsyncJobStatus
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:196](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L196)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `key`       | `string` |
| `namespace` | `string` |

###### Returns

`Promise`\<
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteByKey`](Base.md#_deletebykey)

##### \_readOrCreateByQuery()

```ts
protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[AsyncJobStatus, boolean]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L134)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<\[[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus), `boolean`\]\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_readOrCreateByQuery`](Base.md#_readorcreatebyquery)

##### \_updateAllByQuery()

```ts
protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<AsyncJobStatus[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:169](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L169)

###### Parameters

| Parameter   | Type             |
| ----------- | ---------------- |
| `tenantId`  | `number`         |
| `value`     | `Partial`\<`T`\> |
| `query`     | `object`         |
| `namespace` | `string`         |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateAllByQuery`](Base.md#_updateallbyquery)

##### \_updateByKey()

```ts
protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | AsyncJobStatus
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L144)

###### Parameters

| Parameter   | Type             |
| ----------- | ---------------- |
| `tenantId`  | `number`         |
| `value`     | `Partial`\<`T`\> |
| `key`       | `string`         |
| `namespace` | `string`         |

###### Returns

`Promise`\<
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateByKey`](Base.md#_updatebykey)

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<AsyncJobStatus[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                     | Description                                      |
| ------------ | ------------------------------------------------------------------------ | ------------------------------------------------ |
| `tenantId`   | `number`                                                                 | The tenant ID for which to create the entries.   |
| `values`     | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                    | The class of the model.                          |
| `namespace?` | `string`                                                                 | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

A Promise that resolves to the created entries.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`bulkCreate`](Base.md#bulkcreate)

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<AsyncJobStatus>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                   | Description                                    |
| ------------ | ---------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                               | The tenant ID for which to create the entry.   |
| `value`      | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus) | The value of the entry.                        |
| `namespace?` | `string`                                                               | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

A Promise that resolves to the created entry.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`create`](Base.md#create)

##### createAsyncJobStatus()

```ts
createAsyncJobStatus(asyncJobStatus): Promise<AsyncJobStatus>;
```

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L18)

###### Parameters

| Parameter        | Type                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `asyncJobStatus` | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus) |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<AsyncJobStatus>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                   | Description                                    |
| ------------ | ---------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                               | The tenant ID for which to create the entry.   |
| `value`      | [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus) | The value of the entry.                        |
| `key`        | `string`                                                               | The key of the entry.                          |
| `namespace?` | `string`                                                               | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

A Promise that resolves to the created entry.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`createByKey`](Base.md#createbykey)

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<AsyncJobStatus[]>;
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

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

A Promise that resolves to the deleted entries.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteAllByQuery`](Base.md#deleteallbyquery)

##### deleteByJobId()

```ts
deleteByJobId(jobId): Promise<
  | AsyncJobStatus
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L56)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `jobId`   | `string` |

###### Returns

`Promise`\<
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | AsyncJobStatus
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
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteByKey`](Base.md#deletebykey)

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

| Parameter | Type                                                                                         | Description                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                          | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`emit`](Base.md#emit)

##### existByQuery()

```ts
existByQuery(
   tenantId,
   query,
namespace?): Promise<number>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L91)

Checks how many values associated with a query exists in the specified namespace.

###### Parameters

| Parameter   | Type     | Description                                          |
| ----------- | -------- | ---------------------------------------------------- |
| `tenantId`  | `number` | The tenant ID for which to check the query.          |
| `query`     | `object` | The query to use.                                    |
| `namespace` | `string` | Optional. The namespace in which to check the query. |

###### Returns

`Promise`\<`number`\>

A Promise that resolves to the number of values matching the query.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existByQuery`](Base.md#existbyquery)

##### existsByKey()

```ts
existsByKey(
   tenantId,
   key,
namespace?): Promise<boolean>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L83)

Checks if a key exists in the specified namespace.

###### Parameters

| Parameter   | Type     | Description                                        |
| ----------- | -------- | -------------------------------------------------- |
| `tenantId`  | `number` | The tenant ID for which to check the key.          |
| `key`       | `string` | The key to check.                                  |
| `namespace` | `string` | Optional. The namespace in which to check the key. |

###### Returns

`Promise`\<`boolean`\>

A Promise that resolves to a boolean indicating whether the key exists.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existsByKey`](Base.md#existsbykey)

##### findAllByQuery()

```ts
findAllByQuery(query): Promise<AsyncJobStatus[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L51)

###### Parameters

| Parameter     | Type                  |
| ------------- | --------------------- |
| `query`       | \{ `where`: `any`; \} |
| `query.where` | `any`                 |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

##### findAndCount()

```ts
findAndCount(
   tenantId,
   options,
   namespace?): Promise<{
  count: number;
  rows: AsyncJobStatus[];
}>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L99)

###### Parameters

| Parameter   | Type                                                              |
| ----------- | ----------------------------------------------------------------- |
| `tenantId`  | `number`                                                          |
| `options`   | `Omit`\<`FindAndCountOptions`\<`Attributes`\<`T`\>\>, `"group"`\> |
| `namespace` | `string`                                                          |

###### Returns

`Promise`\<\{
`count`: `number`;
`rows`: [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[];
\}\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`findAndCount`](Base.md#findandcount)

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

[`SequelizeRepository`](Base.md#sequelizerepository).[`on`](Base.md#on)

##### readAllByQuery()

```ts
readAllByQuery(
   tenantId,
   query,
namespace?): Promise<AsyncJobStatus[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L46)

Reads values from storage based on the given query.

###### Parameters

| Parameter   | Type     | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| `tenantId`  | `number` | The tenant ID for which to read the entries. |
| `query`     | `object` | The query to use.                            |
| `namespace` | `string` | Optional namespace for the query.            |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

A promise that resolves to the values associated with the query.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readAllByQuery`](Base.md#readallbyquery)

##### readAllBySqlString()

```ts
readAllBySqlString(
   tenantId,
   sqlString,
_namespace?): Promise<object[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L56)

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `tenantId`   | `number` |
| `sqlString`  | `string` |
| `_namespace` | `string` |

###### Returns

`Promise`\<`object`[]\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readAllBySqlString`](Base.md#readallbysqlstring)

##### readByJobId()

```ts
readByJobId(jobId): Promise<
  | AsyncJobStatus
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L42)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `jobId`   | `string` |

###### Returns

`Promise`\<
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

##### readByKey()

```ts
readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | AsyncJobStatus
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L38)

Reads a value from storage based on the given key.

###### Parameters

| Parameter   | Type                 | Description                                |
| ----------- | -------------------- | ------------------------------------------ |
| `tenantId`  | `number`             | The tenant ID for which to read the entry. |
| `key`       | `string` \| `number` | The key to look up in storage.             |
| `namespace` | `string`             | Optional namespace for the key.            |

###### Returns

`Promise`\<
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readByKey`](Base.md#readbykey)

##### readNextValue()

```ts
readNextValue(
   tenantId,
   columnName,
   query?,
   startValue?,
namespace?): Promise<number>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L64)

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

[`SequelizeRepository`](Base.md#sequelizerepository).[`readNextValue`](Base.md#readnextvalue)

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | AsyncJobStatus
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
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOnlyOneByQuery`](Base.md#readonlyonebyquery)

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[AsyncJobStatus, boolean]>;
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

`Promise`\<\[[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOrCreateByQuery`](Base.md#readorcreatebyquery)

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<AsyncJobStatus[]>;
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

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)[]\>

A promise that resolves to the updated values associated with the query.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateAllByQuery`](Base.md#updateallbyquery)

##### updateAsyncJobStatus()

```ts
updateAsyncJobStatus(updateData): Promise<AsyncJobStatus>;
```

Defined in: [01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/AsyncJobStatus.ts#L22)

###### Parameters

| Parameter                      | Type                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateData`                   | \{ `finishedAt?`: `Date`; `isFailed?`: `boolean`; `jobId`: `string`; `paginationParams?`: `any`; `stoppedAt?`: `Date` \| `null`; `stopScheduled?`: `boolean`; `totalObjects?`: `number`; \} |
| `updateData.finishedAt?`       | `Date`                                                                                                                                                                                      |
| `updateData.isFailed?`         | `boolean`                                                                                                                                                                                   |
| `updateData.jobId`             | `string`                                                                                                                                                                                    |
| `updateData.paginationParams?` | `any`                                                                                                                                                                                       |
| `updateData.stoppedAt?`        | `Date` \| `null`                                                                                                                                                                            |
| `updateData.stopScheduled?`    | `boolean`                                                                                                                                                                                   |
| `updateData.totalObjects?`     | `number`                                                                                                                                                                                    |

###### Returns

`Promise`\<[`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)\>

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | AsyncJobStatus
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
\| [`AsyncJobStatus`](../model/AsyncJob/AsyncJobStatus.md#asyncjobstatus)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateByKey`](Base.md#updatebykey)
