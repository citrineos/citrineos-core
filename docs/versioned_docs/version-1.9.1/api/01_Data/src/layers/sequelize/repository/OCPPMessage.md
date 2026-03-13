[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/repository/OCPPMessage

# 01_Data/src/layers/sequelize/repository/OCPPMessage

## Classes

### SequelizeOCPPMessageRepository

Defined in: [01_Data/src/layers/sequelize/repository/OCPPMessage.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/OCPPMessage.ts#L13)

#### Extends

- [`SequelizeRepository`](Base.md#sequelizerepository)\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>

#### Implements

- [`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository)

#### Constructors

##### Constructor

```ts
new SequelizeOCPPMessageRepository(
   config,
   logger?,
   sequelizeInstance?): SequelizeOCPPMessageRepository;
```

Defined in: [01_Data/src/layers/sequelize/repository/OCPPMessage.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/OCPPMessage.ts#L17)

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

[`SequelizeOCPPMessageRepository`](#sequelizeocppmessagerepository)

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
namespace?): Promise<OCPPMessage[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L115)

###### Parameters

| Parameter   | Type                                                   |
| ----------- | ------------------------------------------------------ |
| `tenantId`  | `number`                                               |
| `values`    | [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[] |
| `namespace` | `string`                                               |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_bulkCreate`](../../../interfaces/repositories.md#_bulkcreate-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_bulkCreate`](Base.md#_bulkcreate)

##### \_create()

```ts
protected _create(
   tenantId,
   value,
_namespace?): Promise<OCPPMessage>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L107)

###### Parameters

| Parameter    | Type                                                 |
| ------------ | ---------------------------------------------------- |
| `tenantId`   | `number`                                             |
| `value`      | [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) |
| `_namespace` | `string`                                             |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_create`](../../../interfaces/repositories.md#_create-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_create`](Base.md#_create)

##### \_createByKey()

```ts
protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<OCPPMessage>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L123)

###### Parameters

| Parameter   | Type                                                 |
| ----------- | ---------------------------------------------------- |
| `tenantId`  | `number`                                             |
| `value`     | [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) |
| `key`       | `string`                                             |
| `namespace` | `string`                                             |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_createByKey`](../../../interfaces/repositories.md#_createbykey-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_createByKey`](Base.md#_createbykey)

##### \_deleteAllByQuery()

```ts
protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<OCPPMessage[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L218)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_deleteAllByQuery`](../../../interfaces/repositories.md#_deleteallbyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteAllByQuery`](Base.md#_deleteallbyquery)

##### \_deleteByKey()

```ts
protected _deleteByKey(
   tenantId,
   key,
namespace?): Promise<OCPPMessage | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:196](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L196)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `key`       | `string` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_deleteByKey`](../../../interfaces/repositories.md#_deletebykey-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteByKey`](Base.md#_deletebykey)

##### \_readOrCreateByQuery()

```ts
protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[OCPPMessage, boolean]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L134)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<\[[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage), `boolean`\]\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_readOrCreateByQuery`](../../../interfaces/repositories.md#_readorcreatebyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_readOrCreateByQuery`](Base.md#_readorcreatebyquery)

##### \_updateAllByQuery()

```ts
protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<OCPPMessage[]>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_updateAllByQuery`](../../../interfaces/repositories.md#_updateallbyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateAllByQuery`](Base.md#_updateallbyquery)

##### \_updateByKey()

```ts
protected _updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<OCPPMessage | undefined>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`_updateByKey`](../../../interfaces/repositories.md#_updatebykey-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateByKey`](Base.md#_updatebykey)

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

| Parameter    | Type                                                   | Description                                      |
| ------------ | ------------------------------------------------------ | ------------------------------------------------ |
| `tenantId`   | `number`                                               | The tenant ID for which to create the entries.   |
| `values`     | [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[] | The values of the entries.                       |
| `clazz`      | `any`                                                  | The class of the model.                          |
| `namespace?` | `string`                                               | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

A Promise that resolves to the created entries.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`bulkCreate`](../../../interfaces/repositories.md#bulkcreate-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`bulkCreate`](Base.md#bulkcreate)

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

| Parameter    | Type                                                 | Description                                    |
| ------------ | ---------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                             | The tenant ID for which to create the entry.   |
| `value`      | [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) | The value of the entry.                        |
| `namespace?` | `string`                                             | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>

A Promise that resolves to the created entry.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`create`](../../../interfaces/repositories.md#create-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`create`](Base.md#create)

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

| Parameter    | Type                                                 | Description                                    |
| ------------ | ---------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                             | The tenant ID for which to create the entry.   |
| `value`      | [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) | The value of the entry.                        |
| `key`        | `string`                                             | The key of the entry.                          |
| `namespace?` | `string`                                             | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>

A Promise that resolves to the created entry.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`createByKey`](../../../interfaces/repositories.md#createbykey-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`createByKey`](Base.md#createbykey)

##### createOCPPMessage()

```ts
createOCPPMessage(tenantId, message): Promise<OCPPMessage>;
```

Defined in: [01_Data/src/layers/sequelize/repository/OCPPMessage.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/OCPPMessage.ts#L21)

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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`createOCPPMessage`](../../../interfaces/repositories.md#createocppmessage)

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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

A Promise that resolves to the deleted entries.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`deleteAllByQuery`](../../../interfaces/repositories.md#deleteallbyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteAllByQuery`](Base.md#deleteallbyquery)

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
namespace?): Promise<OCPPMessage | undefined>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`deleteByKey`](../../../interfaces/repositories.md#deletebykey-14)

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

| Parameter | Type                                                                       | Description                                                                                                   |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                        | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`emit`](../../../interfaces/repositories.md#emit-14)

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

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`existByQuery`](../../../interfaces/repositories.md#existbyquery-14)

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

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`existsByKey`](../../../interfaces/repositories.md#existsbykey-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existsByKey`](Base.md#existsbykey)

##### findAndCount()

```ts
findAndCount(
   tenantId,
   options,
   namespace?): Promise<{
  count: number;
  rows: OCPPMessage[];
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
`rows`: [`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[];
\}\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`findAndCount`](Base.md#findandcount)

##### getRequestByCorrelationId()

```ts
getRequestByCorrelationId(tenantId, correlationId): Promise<OCPPMessage | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/OCPPMessage.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/OCPPMessage.ts#L78)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `correlationId` | `string` |

###### Returns

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`getRequestByCorrelationId`](../../../interfaces/repositories.md#getrequestbycorrelationid)

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

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`on`](../../../interfaces/repositories.md#on-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`on`](Base.md#on)

##### readAllByQuery()

```ts
readAllByQuery(
   tenantId,
   query,
namespace?): Promise<OCPPMessage[]>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

A promise that resolves to the values associated with the query.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`readAllByQuery`](../../../interfaces/repositories.md#readallbyquery-14)

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

##### readByKey()

```ts
readByKey(
   tenantId,
   key,
namespace?): Promise<OCPPMessage | undefined>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`readByKey`](../../../interfaces/repositories.md#readbykey-14)

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

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`readNextValue`](../../../interfaces/repositories.md#readnextvalue-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readNextValue`](Base.md#readnextvalue)

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
namespace?): Promise<OCPPMessage | undefined>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`readOnlyOneByQuery`](../../../interfaces/repositories.md#readonlyonebyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOnlyOneByQuery`](Base.md#readonlyonebyquery)

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

`Promise`\<\[[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`readOrCreateByQuery`](../../../interfaces/repositories.md#readorcreatebyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOrCreateByQuery`](Base.md#readorcreatebyquery)

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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage)[]\>

A promise that resolves to the updated values associated with the query.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`updateAllByQuery`](../../../interfaces/repositories.md#updateallbyquery-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateAllByQuery`](Base.md#updateallbyquery)

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<OCPPMessage | undefined>;
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

`Promise`\<[`OCPPMessage`](../model/OCPPMessage.md#ocppmessage) \| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Implementation of

[`IOCPPMessageRepository`](../../../interfaces/repositories.md#iocppmessagerepository).[`updateByKey`](../../../interfaces/repositories.md#updatebykey-14)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateByKey`](Base.md#updatebykey)
