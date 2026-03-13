[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/repository/Location

# 01_Data/src/layers/sequelize/repository/Location

## Classes

### SequelizeLocationRepository

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L21)

#### Extends

- [`SequelizeRepository`](Base.md#sequelizerepository)\<[`Location`](../model/Location/Location.md#location)\>

#### Implements

- [`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository)

#### Constructors

##### Constructor

```ts
new SequelizeLocationRepository(
   config,
   logger?,
   sequelizeInstance?,
   chargingStation?,
   statusNotification?,
   latestStatusNotification?,
   connector?): SequelizeLocationRepository;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L30)

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
| `chargingStation?`                         | `CrudRepository`\<[`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `statusNotification?`                      | `CrudRepository`\<[`StatusNotification`](../model/Location/StatusNotification.md#statusnotification)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `latestStatusNotification?`                | `CrudRepository`\<[`LatestStatusNotification`](../model/Location/LatestStatusNotification.md#lateststatusnotification)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `connector?`                               | `CrudRepository`\<[`Connector`](../model/Location/Connector.md#connector)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

###### Returns

[`SequelizeLocationRepository`](#sequelizelocationrepository)

###### Overrides

[`SequelizeRepository`](Base.md#sequelizerepository).[`constructor`](Base.md#constructor)

#### Properties

| Property                                                         | Modifier    | Type                                                                                                                     | Inherited from                                                                        | Defined in                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingstation"></a> `chargingStation`                   | `public`    | `CrudRepository`\<[`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)\>                            | -                                                                                     | [01_Data/src/layers/sequelize/repository/Location.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L25) |
| <a id="connector"></a> `connector`                               | `public`    | `CrudRepository`\<[`Connector`](../model/Location/Connector.md#connector)\>                                              | -                                                                                     | [01_Data/src/layers/sequelize/repository/Location.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L28) |
| <a id="lateststatusnotification"></a> `latestStatusNotification` | `public`    | `CrudRepository`\<[`LatestStatusNotification`](../model/Location/LatestStatusNotification.md#lateststatusnotification)\> | -                                                                                     | [01_Data/src/layers/sequelize/repository/Location.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L27) |
| <a id="logger"></a> `logger`                                     | `protected` | `Logger`\<`ILogObj`\>                                                                                                    | [`SequelizeRepository`](Base.md#sequelizerepository).[`logger`](Base.md#logger)       | [01_Data/src/layers/sequelize/repository/Base.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L22)         |
| <a id="namespace"></a> `namespace`                               | `protected` | `string`                                                                                                                 | [`SequelizeRepository`](Base.md#sequelizerepository).[`namespace`](Base.md#namespace) | [01_Data/src/layers/sequelize/repository/Base.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L21)         |
| <a id="s"></a> `s`                                               | `protected` | `Sequelize`                                                                                                              | [`SequelizeRepository`](Base.md#sequelizerepository).[`s`](Base.md#s)                 | [01_Data/src/layers/sequelize/repository/Base.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L20)         |
| <a id="statusnotification"></a> `statusNotification`             | `public`    | `CrudRepository`\<[`StatusNotification`](../model/Location/StatusNotification.md#statusnotification)\>                   | -                                                                                     | [01_Data/src/layers/sequelize/repository/Location.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L26) |

#### Methods

##### \_bulkCreate()

```ts
protected _bulkCreate(
   tenantId,
   values,
namespace?): Promise<Location[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L115)

###### Parameters

| Parameter   | Type                                                   |
| ----------- | ------------------------------------------------------ |
| `tenantId`  | `number`                                               |
| `values`    | [`Location`](../model/Location/Location.md#location)[] |
| `namespace` | `string`                                               |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_bulkCreate`](../../../interfaces/repositories.md#_bulkcreate-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_bulkCreate`](Base.md#_bulkcreate)

##### \_create()

```ts
protected _create(
   tenantId,
   value,
_namespace?): Promise<Location>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L107)

###### Parameters

| Parameter    | Type                                                 |
| ------------ | ---------------------------------------------------- |
| `tenantId`   | `number`                                             |
| `value`      | [`Location`](../model/Location/Location.md#location) |
| `_namespace` | `string`                                             |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_create`](../../../interfaces/repositories.md#_create-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_create`](Base.md#_create)

##### \_createByKey()

```ts
protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Location>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L123)

###### Parameters

| Parameter   | Type                                                 |
| ----------- | ---------------------------------------------------- |
| `tenantId`  | `number`                                             |
| `value`     | [`Location`](../model/Location/Location.md#location) |
| `key`       | `string`                                             |
| `namespace` | `string`                                             |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_createByKey`](../../../interfaces/repositories.md#_createbykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_createByKey`](Base.md#_createbykey)

##### \_deleteAllByQuery()

```ts
protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<Location[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L218)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_deleteAllByQuery`](../../../interfaces/repositories.md#_deleteallbyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteAllByQuery`](Base.md#_deleteallbyquery)

##### \_deleteByKey()

```ts
protected _deleteByKey(
   tenantId,
   key,
namespace?): Promise<Location | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:196](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L196)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `key`       | `string` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_deleteByKey`](../../../interfaces/repositories.md#_deletebykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteByKey`](Base.md#_deletebykey)

##### \_readOrCreateByQuery()

```ts
protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[Location, boolean]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L134)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<\[[`Location`](../model/Location/Location.md#location), `boolean`\]\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_readOrCreateByQuery`](../../../interfaces/repositories.md#_readorcreatebyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_readOrCreateByQuery`](Base.md#_readorcreatebyquery)

##### \_updateAllByQuery()

```ts
protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<Location[]>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_updateAllByQuery`](../../../interfaces/repositories.md#_updateallbyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateAllByQuery`](Base.md#_updateallbyquery)

##### \_updateByKey()

```ts
protected _updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Location | undefined>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`_updateByKey`](../../../interfaces/repositories.md#_updatebykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateByKey`](Base.md#_updatebykey)

##### addStatusNotificationToChargingStation()

```ts
addStatusNotificationToChargingStation(
   tenantId,
   stationId,
statusNotification): Promise<void>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L117)

###### Parameters

| Parameter            | Type                                                                               |
| -------------------- | ---------------------------------------------------------------------------------- |
| `tenantId`           | `number`                                                                           |
| `stationId`          | `string`                                                                           |
| `statusNotification` | [`StatusNotification`](../model/Location/StatusNotification.md#statusnotification) |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`addStatusNotificationToChargingStation`](../../../interfaces/repositories.md#addstatusnotificationtochargingstation)

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

| Parameter    | Type                                                   | Description                                      |
| ------------ | ------------------------------------------------------ | ------------------------------------------------ |
| `tenantId`   | `number`                                               | The tenant ID for which to create the entries.   |
| `values`     | [`Location`](../model/Location/Location.md#location)[] | The values of the entries.                       |
| `clazz`      | `any`                                                  | The class of the model.                          |
| `namespace?` | `string`                                               | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

A Promise that resolves to the created entries.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`bulkCreate`](../../../interfaces/repositories.md#bulkcreate-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`bulkCreate`](Base.md#bulkcreate)

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

| Parameter    | Type                                                 | Description                                    |
| ------------ | ---------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                             | The tenant ID for which to create the entry.   |
| `value`      | [`Location`](../model/Location/Location.md#location) | The value of the entry.                        |
| `namespace?` | `string`                                             | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)\>

A Promise that resolves to the created entry.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`create`](../../../interfaces/repositories.md#create-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`create`](Base.md#create)

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

| Parameter    | Type                                                 | Description                                    |
| ------------ | ---------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                             | The tenant ID for which to create the entry.   |
| `value`      | [`Location`](../model/Location/Location.md#location) | The value of the entry.                        |
| `key`        | `string`                                             | The key of the entry.                          |
| `namespace?` | `string`                                             | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)\>

A Promise that resolves to the created entry.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`createByKey`](../../../interfaces/repositories.md#createbykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`createByKey`](Base.md#createbykey)

##### createOrUpdateChargingStation()

```ts
createOrUpdateChargingStation(tenantId, chargingStation): Promise<ChargingStation>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:245](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L245)

###### Parameters

| Parameter         | Type                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `tenantId`        | `number`                                                                  |
| `chargingStation` | [`ChargingStation`](../model/Location/ChargingStation.md#chargingstation) |

###### Returns

`Promise`\<[`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`createOrUpdateChargingStation`](../../../interfaces/repositories.md#createorupdatechargingstation)

##### createOrUpdateConnector()

```ts
createOrUpdateConnector(tenantId, connector): Promise<Connector | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:298](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L298)

###### Parameters

| Parameter   | Type                                                    |
| ----------- | ------------------------------------------------------- |
| `tenantId`  | `number`                                                |
| `connector` | [`Connector`](../model/Location/Connector.md#connector) |

###### Returns

`Promise`\<[`Connector`](../model/Location/Connector.md#connector) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`createOrUpdateConnector`](../../../interfaces/repositories.md#createorupdateconnector)

##### createOrUpdateLocationWithChargingStations()

```ts
createOrUpdateLocationWithChargingStations(tenantId, location): Promise<Location>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:193](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L193)

###### Parameters

| Parameter  | Type                                                              |
| ---------- | ----------------------------------------------------------------- |
| `tenantId` | `number`                                                          |
| `location` | `Partial`\<[`Location`](../model/Location/Location.md#location)\> |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location)\>

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

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

A Promise that resolves to the deleted entries.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`deleteAllByQuery`](../../../interfaces/repositories.md#deleteallbyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteAllByQuery`](Base.md#deleteallbyquery)

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
namespace?): Promise<Location | undefined>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`deleteByKey`](../../../interfaces/repositories.md#deletebykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteByKey`](Base.md#deletebykey)

##### doesChargingStationExistByStationId()

```ts
doesChargingStationExistByStationId(tenantId, stationId): Promise<boolean>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:113](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L113)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`doesChargingStationExistByStationId`](../../../interfaces/repositories.md#doeschargingstationexistbystationid)

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
| ...`args` | `CrudEvent`\<[`Location`](../model/Location/Location.md#location)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`emit`](../../../interfaces/repositories.md#emit-12)

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

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`existByQuery`](../../../interfaces/repositories.md#existbyquery-12)

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

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`existsByKey`](../../../interfaces/repositories.md#existsbykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existsByKey`](Base.md#existsbykey)

##### findAndCount()

```ts
findAndCount(
   tenantId,
   options,
   namespace?): Promise<{
  count: number;
  rows: Location[];
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
`rows`: [`Location`](../model/Location/Location.md#location)[];
\}\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`findAndCount`](Base.md#findandcount)

##### getChargingStationsByIds()

```ts
getChargingStationsByIds(tenantId, stationIds): Promise<ChargingStation[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:178](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L178)

###### Parameters

| Parameter    | Type       |
| ------------ | ---------- |
| `tenantId`   | `number`   |
| `stationIds` | `string`[] |

###### Returns

`Promise`\<[`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)[]\>

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

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`on`](../../../interfaces/repositories.md#on-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`on`](Base.md#on)

##### readAllByQuery()

```ts
readAllByQuery(
   tenantId,
   query,
namespace?): Promise<Location[]>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

A promise that resolves to the values associated with the query.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readAllByQuery`](../../../interfaces/repositories.md#readallbyquery-12)

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
namespace?): Promise<Location | undefined>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readByKey`](../../../interfaces/repositories.md#readbykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readByKey`](Base.md#readbykey)

##### readChargingStationByStationId()

```ts
readChargingStationByStationId(tenantId, stationId): Promise<
  | ChargingStation
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L76)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<
\| [`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)
\| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readChargingStationByStationId`](../../../interfaces/repositories.md#readchargingstationbystationid)

##### readConnectorByStationIdAndOcpp16ConnectorId()

```ts
readConnectorByStationIdAndOcpp16ConnectorId(
   tenantId,
   stationId,
ocpp16ConnectorId): Promise<Connector | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:353](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L353)

###### Parameters

| Parameter           | Type     |
| ------------------- | -------- |
| `tenantId`          | `number` |
| `stationId`         | `string` |
| `ocpp16ConnectorId` | `number` |

###### Returns

`Promise`\<[`Connector`](../model/Location/Connector.md#connector) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readConnectorByStationIdAndOcpp16ConnectorId`](../../../interfaces/repositories.md#readconnectorbystationidandocpp16connectorid)

##### readConnectorByStationIdAndOcpp201EvseType()

```ts
readConnectorByStationIdAndOcpp201EvseType(
   tenantId,
   stationId,
ocpp201EvseType): Promise<Connector | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:387](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L387)

###### Parameters

| Parameter         | Type       |
| ----------------- | ---------- |
| `tenantId`        | `number`   |
| `stationId`       | `string`   |
| `ocpp201EvseType` | `EVSEType` |

###### Returns

`Promise`\<[`Connector`](../model/Location/Connector.md#connector) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readConnectorByStationIdAndOcpp201EvseType`](../../../interfaces/repositories.md#readconnectorbystationidandocpp201evsetype)

##### readEvseByStationIdAndOcpp201EvseId()

```ts
readEvseByStationIdAndOcpp201EvseId(
   tenantId,
   stationId,
ocpp201EvseId): Promise<Evse | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:370](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L370)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `stationId`     | `string` |
| `ocpp201EvseId` | `number` |

###### Returns

`Promise`\<[`Evse`](../model/Location/Evse.md#evse) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readEvseByStationIdAndOcpp201EvseId`](../../../interfaces/repositories.md#readevsebystationidandocpp201evseid)

##### readLocationById()

```ts
readLocationById(tenantId, id): Promise<Location | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L69)

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |
| `id`       | `number` |

###### Returns

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readLocationById`](../../../interfaces/repositories.md#readlocationbyid)

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

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readNextValue`](../../../interfaces/repositories.md#readnextvalue-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readNextValue`](Base.md#readnextvalue)

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
namespace?): Promise<Location | undefined>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readOnlyOneByQuery`](../../../interfaces/repositories.md#readonlyonebyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOnlyOneByQuery`](Base.md#readonlyonebyquery)

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

`Promise`\<\[[`Location`](../model/Location/Location.md#location), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`readOrCreateByQuery`](../../../interfaces/repositories.md#readorcreatebyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOrCreateByQuery`](Base.md#readorcreatebyquery)

##### setChargingStationIsOnlineAndOCPPVersion()

```ts
setChargingStationIsOnlineAndOCPPVersion(
   tenantId,
   stationId,
   isOnline,
   ocppVersion): Promise<
  | ChargingStation
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L91)

###### Parameters

| Parameter     | Type                    |
| ------------- | ----------------------- |
| `tenantId`    | `number`                |
| `stationId`   | `string`                |
| `isOnline`    | `boolean`               |
| `ocppVersion` | `OCPPVersion` \| `null` |

###### Returns

`Promise`\<
\| [`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)
\| `undefined`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`setChargingStationIsOnlineAndOCPPVersion`](../../../interfaces/repositories.md#setchargingstationisonlineandocppversion)

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

`Promise`\<[`Location`](../model/Location/Location.md#location)[]\>

A promise that resolves to the updated values associated with the query.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`updateAllByQuery`](../../../interfaces/repositories.md#updateallbyquery-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateAllByQuery`](Base.md#updateallbyquery)

##### updateAllConnectorsByQuery()

```ts
updateAllConnectorsByQuery(
   tenantId,
   value,
query): Promise<Connector[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:333](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L333)

###### Parameters

| Parameter  | Type                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `tenantId` | `number`                                                             |
| `value`    | `Partial`\<[`Connector`](../model/Location/Connector.md#connector)\> |
| `query`    | `object`                                                             |

###### Returns

`Promise`\<[`Connector`](../model/Location/Connector.md#connector)[]\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`updateAllConnectorsByQuery`](../../../interfaces/repositories.md#updateallconnectorsbyquery)

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
namespace?): Promise<Location | undefined>;
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

`Promise`\<[`Location`](../model/Location/Location.md#location) \| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`updateByKey`](../../../interfaces/repositories.md#updatebykey-12)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateByKey`](Base.md#updatebykey)

##### updateChargingStationTimestamp()

```ts
updateChargingStationTimestamp(
   tenantId,
   stationId,
timestamp): Promise<void>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:341](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L341)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |
| `timestamp` | `string` |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`ILocationRepository`](../../../interfaces/repositories.md#ilocationrepository).[`updateChargingStationTimestamp`](../../../interfaces/repositories.md#updatechargingstationtimestamp)

##### updateLatestStatusNotification()

```ts
updateLatestStatusNotification(
   tenantId,
   stationId,
statusNotification): Promise<void>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Location.ts:133](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Location.ts#L133)

###### Parameters

| Parameter            | Type                                                                               |
| -------------------- | ---------------------------------------------------------------------------------- |
| `tenantId`           | `number`                                                                           |
| `stationId`          | `string`                                                                           |
| `statusNotification` | [`StatusNotification`](../model/Location/StatusNotification.md#statusnotification) |

###### Returns

`Promise`\<`void`\>
