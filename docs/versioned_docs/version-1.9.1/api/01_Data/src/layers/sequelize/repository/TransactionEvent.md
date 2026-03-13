[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/repository/TransactionEvent

# 01_Data/src/layers/sequelize/repository/TransactionEvent

## Classes

### SequelizeTransactionEventRepository

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L39)

#### Extends

- [`SequelizeRepository`](Base.md#sequelizerepository)\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)\>

#### Implements

- [`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository)

#### Constructors

##### Constructor

```ts
new SequelizeTransactionEventRepository(
   config,
   logger?,
   namespace?,
   sequelizeInstance?,
   transaction?,
   station?,
   evse?,
   meterValue?,
   startTransaction?,
   stopTransaction?,
   connector?,
   chargingStationSequence?): SequelizeTransactionEventRepository;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L52)

###### Parameters

| Parameter                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default value                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `config`                                   | \{ `configDir?`: `string`; `configFileName`: `string`; `database`: \{ `alter`: `boolean`; `database`: `string`; `dialect`: `string`; `force`: `boolean`; `host`: `string`; `maxRetries`: `number`; `password`: `string`; `pool?`: \{ `acquire?`: `number`; `idle?`: `number`; `max?`: `number`; `min?`: `number`; \}; `port`: `number`; `retryDelay`: `number`; `sync`: `boolean`; `username`: `string`; \}; `fileAccess`: \{ `gcp?`: \{ `credentials?`: `Record`\<`string`, `never`\>; `projectId`: `string`; \}; `local?`: \{ `defaultFilePath`: `string`; \}; `s3?`: \{ `accessKeyId?`: `string`; `defaultBucketName`: `string`; `endpoint?`: `string`; `region?`: `string`; `s3ForcePathStyle`: `boolean`; `secretAccessKey?`: `string`; \}; `type`: `"local"` \| `"s3"` \| `"gcp"`; \}; \} | `undefined`                   |
| `config.configDir?`                        | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.configFileName?`                   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database?`                         | \{ `alter`: `boolean`; `database`: `string`; `dialect`: `string`; `force`: `boolean`; `host`: `string`; `maxRetries`: `number`; `password`: `string`; `pool?`: \{ `acquire?`: `number`; `idle?`: `number`; `max?`: `number`; `min?`: `number`; \}; `port`: `number`; `retryDelay`: `number`; `sync`: `boolean`; `username`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.alter?`                   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                   |
| `config.database.database?`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.dialect?`                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.force?`                   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                   |
| `config.database.host?`                    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.maxRetries?`              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.password?`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.pool?`                    | \{ `acquire?`: `number`; `idle?`: `number`; `max?`: `number`; `min?`: `number`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `undefined`                   |
| `config.database.pool.acquire?`            | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.pool.idle?`               | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.pool.max?`                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.pool.min?`                | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.port?`                    | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.retryDelay?`              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.database.sync?`                    | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                   |
| `config.database.username?`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess?`                       | \{ `gcp?`: \{ `credentials?`: `Record`\<`string`, `never`\>; `projectId`: `string`; \}; `local?`: \{ `defaultFilePath`: `string`; \}; `s3?`: \{ `accessKeyId?`: `string`; `defaultBucketName`: `string`; `endpoint?`: `string`; `region?`: `string`; `s3ForcePathStyle`: `boolean`; `secretAccessKey?`: `string`; \}; `type`: `"local"` \| `"s3"` \| `"gcp"`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                   |
| `config.fileAccess.gcp?`                   | \{ `credentials?`: `Record`\<`string`, `never`\>; `projectId`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`                   |
| `config.fileAccess.gcp.credentials?`       | `Record`\<`string`, `never`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                   |
| `config.fileAccess.gcp.projectId?`         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.local?`                 | \{ `defaultFilePath`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `undefined`                   |
| `config.fileAccess.local.defaultFilePath?` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.s3?`                    | \{ `accessKeyId?`: `string`; `defaultBucketName`: `string`; `endpoint?`: `string`; `region?`: `string`; `s3ForcePathStyle`: `boolean`; `secretAccessKey?`: `string`; \}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`                   |
| `config.fileAccess.s3.accessKeyId?`        | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.s3.defaultBucketName?`  | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.s3.endpoint?`           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.s3.region?`             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.s3.s3ForcePathStyle?`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                   |
| `config.fileAccess.s3.secretAccessKey?`    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `config.fileAccess.type?`                  | `"local"` \| `"s3"` \| `"gcp"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `undefined`                   |
| `logger?`                                  | `Logger`\<`ILogObj`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `undefined`                   |
| `namespace?`                               | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `TransactionEvent.MODEL_NAME` |
| `sequelizeInstance?`                       | `Sequelize`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`                   |
| `transaction?`                             | `CrudRepository`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                   |
| `station?`                                 | `CrudRepository`\<[`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`                   |
| `evse?`                                    | `CrudRepository`\<[`Evse`](../model/Location/Evse.md#evse)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `undefined`                   |
| `meterValue?`                              | `CrudRepository`\<[`MeterValue`](../model/TransactionEvent/MeterValue.md#metervalue)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `undefined`                   |
| `startTransaction?`                        | `CrudRepository`\<[`StartTransaction`](../model/TransactionEvent/StartTransaction.md#starttransaction)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                   |
| `stopTransaction?`                         | `CrudRepository`\<[`StopTransaction`](../model/TransactionEvent/StopTransaction.md#stoptransaction)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `undefined`                   |
| `connector?`                               | `CrudRepository`\<[`Connector`](../model/Location/Connector.md#connector)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`                   |
| `chargingStationSequence?`                 | [`IChargingStationSequenceRepository`](../../../interfaces/repositories.md#ichargingstationsequencerepository)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `undefined`                   |

###### Returns

[`SequelizeTransactionEventRepository`](#sequelizetransactioneventrepository)

###### Overrides

[`SequelizeRepository`](Base.md#sequelizerepository).[`constructor`](Base.md#constructor)

#### Properties

| Property                                                       | Modifier    | Type                                                                                                           | Inherited from                                                                        | Defined in                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="chargingstationsequence"></a> `chargingStationSequence` | `public`    | [`IChargingStationSequenceRepository`](../../../interfaces/repositories.md#ichargingstationsequencerepository) | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L50) |
| <a id="connector"></a> `connector`                             | `public`    | `CrudRepository`\<[`Connector`](../model/Location/Connector.md#connector)\>                                    | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L49) |
| <a id="evse"></a> `evse`                                       | `public`    | `CrudRepository`\<[`Evse`](../model/Location/Evse.md#evse)\>                                                   | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L44) |
| <a id="logger"></a> `logger`                                   | `protected` | `Logger`\<`ILogObj`\>                                                                                          | [`SequelizeRepository`](Base.md#sequelizerepository).[`logger`](Base.md#logger)       | [01_Data/src/layers/sequelize/repository/Base.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L22)                         |
| <a id="metervalue"></a> `meterValue`                           | `public`    | `CrudRepository`\<[`MeterValue`](../model/TransactionEvent/MeterValue.md#metervalue)\>                         | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L46) |
| <a id="namespace"></a> `namespace`                             | `protected` | `string`                                                                                                       | [`SequelizeRepository`](Base.md#sequelizerepository).[`namespace`](Base.md#namespace) | [01_Data/src/layers/sequelize/repository/Base.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L21)                         |
| <a id="s"></a> `s`                                             | `protected` | `Sequelize`                                                                                                    | [`SequelizeRepository`](Base.md#sequelizerepository).[`s`](Base.md#s)                 | [01_Data/src/layers/sequelize/repository/Base.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L20)                         |
| <a id="starttransaction"></a> `startTransaction`               | `public`    | `CrudRepository`\<[`StartTransaction`](../model/TransactionEvent/StartTransaction.md#starttransaction)\>       | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L47) |
| <a id="station"></a> `station`                                 | `public`    | `CrudRepository`\<[`ChargingStation`](../model/Location/ChargingStation.md#chargingstation)\>                  | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L45) |
| <a id="stoptransaction"></a> `stopTransaction`                 | `public`    | `CrudRepository`\<[`StopTransaction`](../model/TransactionEvent/StopTransaction.md#stoptransaction)\>          | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L48) |
| <a id="transaction"></a> `transaction`                         | `public`    | `CrudRepository`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)\>                      | -                                                                                     | [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L43) |

#### Methods

##### \_bulkCreate()

```ts
protected _bulkCreate(
   tenantId,
   values,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L115)

###### Parameters

| Parameter   | Type                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| `tenantId`  | `number`                                                                               |
| `values`    | [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[] |
| `namespace` | `string`                                                                               |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_bulkCreate`](../../../interfaces/repositories.md#_bulkcreate-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_bulkCreate`](Base.md#_bulkcreate)

##### \_create()

```ts
protected _create(
   tenantId,
   value,
_namespace?): Promise<TransactionEvent>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L107)

###### Parameters

| Parameter    | Type                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| `tenantId`   | `number`                                                                             |
| `value`      | [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent) |
| `_namespace` | `string`                                                                             |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_create`](../../../interfaces/repositories.md#_create-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_create`](Base.md#_create)

##### \_createByKey()

```ts
protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<TransactionEvent>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L123)

###### Parameters

| Parameter   | Type                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| `tenantId`  | `number`                                                                             |
| `value`     | [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent) |
| `key`       | `string`                                                                             |
| `namespace` | `string`                                                                             |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_createByKey`](../../../interfaces/repositories.md#_createbykey-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_createByKey`](Base.md#_createbykey)

##### \_deleteAllByQuery()

```ts
protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<TransactionEvent[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L218)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_deleteAllByQuery`](../../../interfaces/repositories.md#_deleteallbyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteAllByQuery`](Base.md#_deleteallbyquery)

##### \_deleteByKey()

```ts
protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | TransactionEvent
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
\| [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_deleteByKey`](../../../interfaces/repositories.md#_deletebykey-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteByKey`](Base.md#_deletebykey)

##### \_readOrCreateByQuery()

```ts
protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[TransactionEvent, boolean]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L134)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<\[[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent), `boolean`\]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_readOrCreateByQuery`](../../../interfaces/repositories.md#_readorcreatebyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_readOrCreateByQuery`](Base.md#_readorcreatebyquery)

##### \_updateAllByQuery()

```ts
protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<TransactionEvent[]>;
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

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_updateAllByQuery`](../../../interfaces/repositories.md#_updateallbyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateAllByQuery`](Base.md#_updateallbyquery)

##### \_updateByKey()

```ts
protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | TransactionEvent
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
\| [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`_updateByKey`](../../../interfaces/repositories.md#_updatebykey-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateByKey`](Base.md#_updatebykey)

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

| Parameter    | Type                                                                                   | Description                                      |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `tenantId`   | `number`                                                                               | The tenant ID for which to create the entries.   |
| `values`     | [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                  | The class of the model.                          |
| `namespace?` | `string`                                                                               | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A Promise that resolves to the created entries.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`bulkCreate`](../../../interfaces/repositories.md#bulkcreate-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`bulkCreate`](Base.md#bulkcreate)

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

| Parameter    | Type                                                                                 | Description                                    |
| ------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                                                             | The tenant ID for which to create the entry.   |
| `value`      | [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent) | The value of the entry.                        |
| `namespace?` | `string`                                                                             | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)\>

A Promise that resolves to the created entry.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`create`](../../../interfaces/repositories.md#create-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`create`](Base.md#create)

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

| Parameter    | Type                                                                                 | Description                                    |
| ------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `tenantId`   | `number`                                                                             | The tenant ID for which to create the entry.   |
| `value`      | [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent) | The value of the entry.                        |
| `key`        | `string`                                                                             | The key of the entry.                          |
| `namespace?` | `string`                                                                             | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)\>

A Promise that resolves to the created entry.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`createByKey`](../../../interfaces/repositories.md#createbykey-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`createByKey`](Base.md#createbykey)

##### createMeterValue()

```ts
createMeterValue(
   tenantId,
   meterValue,
   transactionDatabaseId?,
   transactionId?,
tariffId?): Promise<MeterValue>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:577](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L577)

###### Parameters

| Parameter                | Type               |
| ------------------------ | ------------------ |
| `tenantId`               | `number`           |
| `meterValue`             | `MeterValueType`   |
| `transactionDatabaseId?` | `number` \| `null` |
| `transactionId?`         | `string` \| `null` |
| `tariffId?`              | `number` \| `null` |

###### Returns

`Promise`\<[`MeterValue`](../model/TransactionEvent/MeterValue.md#metervalue)\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`createMeterValue`](../../../interfaces/repositories.md#createmetervalue)

##### createOrUpdateTransactionByTransactionEventAndStationId()

```ts
createOrUpdateTransactionByTransactionEventAndStationId(
   tenantId,
   value,
stationId): Promise<Transaction>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:126](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L126)

###### Parameters

| Parameter   | Type                      | Description                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tenantId`  | `number`                  | -                                                                                                                                                                                                                                                                                    |
| `value`     | `TransactionEventRequest` | TransactionEventRequest received from charging station. Will be used to create TransactionEvent, MeterValues, and either create or update Transaction. IdTokens (and associated AdditionalInfo) and EVSEs are assumed to already exist and will not be created as part of this call. |
| `stationId` | `string`                  | StationId of charging station which sent TransactionEventRequest.                                                                                                                                                                                                                    |

###### Returns

`Promise`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)\>

Saved TransactionEvent

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`createOrUpdateTransactionByTransactionEventAndStationId`](../../../interfaces/repositories.md#createorupdatetransactionbytransactioneventandstationid)

##### createStopTransaction()

```ts
createStopTransaction(
   tenantId,
   transactionDatabaseId,
   stationId,
   meterStop,
   timestamp,
   meterValues,
reason?): Promise<StopTransaction>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:741](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L741)

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

###### Returns

`Promise`\<[`StopTransaction`](../model/TransactionEvent/StopTransaction.md#stoptransaction)\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`createStopTransaction`](../../../interfaces/repositories.md#createstoptransaction)

##### createTransactionByStartTransaction()

```ts
createTransactionByStartTransaction(
   tenantId,
   request,
stationId): Promise<Transaction>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:653](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L653)

###### Parameters

| Parameter   | Type                      |
| ----------- | ------------------------- |
| `tenantId`  | `number`                  |
| `request`   | `StartTransactionRequest` |
| `stationId` | `string`                  |

###### Returns

`Promise`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`createTransactionByStartTransaction`](../../../interfaces/repositories.md#createtransactionbystarttransaction)

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

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A Promise that resolves to the deleted entries.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`deleteAllByQuery`](../../../interfaces/repositories.md#deleteallbyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteAllByQuery`](Base.md#deleteallbyquery)

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
\| [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`deleteByKey`](../../../interfaces/repositories.md#deletebykey-21)

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

| Parameter | Type                                                                                                       | Description                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                        | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`emit`](../../../interfaces/repositories.md#emit-21)

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

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`existByQuery`](../../../interfaces/repositories.md#existbyquery-21)

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

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`existsByKey`](../../../interfaces/repositories.md#existsbykey-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existsByKey`](Base.md#existsbykey)

##### findAndCount()

```ts
findAndCount(
   tenantId,
   options,
   namespace?): Promise<{
  count: number;
  rows: TransactionEvent[];
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
`rows`: [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[];
\}\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`findAndCount`](Base.md#findandcount)

##### findByTransactionId()

```ts
findByTransactionId(tenantId, transactionId): Promise<
  | Transaction
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:455](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L455)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `transactionId` | `string` |

###### Returns

`Promise`\<
\| [`Transaction`](../model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

##### getActiveTransactionByStationIdAndEvseId()

```ts
getActiveTransactionByStationIdAndEvseId(
   tenantId,
   stationId,
   evseId): Promise<
  | Transaction
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:548](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L548)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |
| `evseId`    | `number` |

###### Returns

`Promise`\<
\| [`Transaction`](../model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`getActiveTransactionByStationIdAndEvseId`](../../../interfaces/repositories.md#getactivetransactionbystationidandevseid)

##### getEvseIdsWithActiveTransactionByStationId()

```ts
getEvseIdsWithActiveTransactionByStationId(tenantId, stationId): Promise<number[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:526](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L526)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`number`[]\>

##### getTransactions()

```ts
getTransactions(
   tenantId,
   dateFrom?,
   dateTo?,
   offset?,
limit?): Promise<Transaction[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:468](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L468)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `dateFrom?` | `Date`   |
| `dateTo?`   | `Date`   |
| `offset?`   | `number` |
| `limit?`    | `number` |

###### Returns

`Promise`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)[]\>

##### getTransactionsCount()

```ts
getTransactionsCount(
   tenantId,
   dateFrom?,
dateTo?): Promise<number>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:504](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L504)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `dateFrom?` | `Date`   |
| `dateTo?`   | `Date`   |

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

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`on`](../../../interfaces/repositories.md#on-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`on`](Base.md#on)

##### readAllActiveTransactionsByAuthorizationId()

```ts
readAllActiveTransactionsByAuthorizationId(tenantId, authorizationId): Promise<Transaction[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:435](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L435)

###### Parameters

| Parameter         | Type     |
| ----------------- | -------- |
| `tenantId`        | `number` |
| `authorizationId` | `number` |

###### Returns

`Promise`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readAllActiveTransactionsByAuthorizationId`](../../../interfaces/repositories.md#readallactivetransactionsbyauthorizationid)

##### readAllByQuery()

```ts
readAllByQuery(
   tenantId,
   query,
namespace?): Promise<TransactionEvent[]>;
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

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A promise that resolves to the values associated with the query.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readAllByQuery`](../../../interfaces/repositories.md#readallbyquery-21)

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

##### readAllByStationIdAndTransactionId()

```ts
readAllByStationIdAndTransactionId(
   tenantId,
   stationId,
transactionId): Promise<TransactionEvent[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:376](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L376)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `stationId`     | `string` |
| `transactionId` | `string` |

###### Returns

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readAllByStationIdAndTransactionId`](../../../interfaces/repositories.md#readallbystationidandtransactionid)

##### readAllMeterValuesByTransactionDataBaseId()

```ts
readAllMeterValuesByTransactionDataBaseId(tenantId, transactionDataBaseId): Promise<MeterValue[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:444](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L444)

###### Parameters

| Parameter               | Type     |
| ----------------------- | -------- |
| `tenantId`              | `number` |
| `transactionDataBaseId` | `number` |

###### Returns

`Promise`\<[`MeterValue`](../model/TransactionEvent/MeterValue.md#metervalue)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readAllMeterValuesByTransactionDataBaseId`](../../../interfaces/repositories.md#readallmetervaluesbytransactiondatabaseid)

##### readAllTransactionsByQuery()

```ts
readAllTransactionsByQuery(tenantId, query): Promise<Transaction[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:522](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L522)

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |
| `query`    | `object` |

###### Returns

`Promise`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)[]\>

##### readAllTransactionsByStationIdAndEvseAndChargingStates()

```ts
readAllTransactionsByStationIdAndEvseAndChargingStates(
   tenantId,
   stationId,
   evse?,
chargingStates?): Promise<Transaction[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:404](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L404)

###### Parameters

| Parameter         | Type                      |
| ----------------- | ------------------------- |
| `tenantId`        | `number`                  |
| `stationId`       | `string`                  |
| `evse?`           | `EVSEType`                |
| `chargingStates?` | `ChargingStateEnumType`[] |

###### Returns

`Promise`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)[]\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readAllTransactionsByStationIdAndEvseAndChargingStates`](../../../interfaces/repositories.md#readalltransactionsbystationidandevseandchargingstates)

##### readByKey()

```ts
readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | TransactionEvent
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
\| [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readByKey`](../../../interfaces/repositories.md#readbykey-21)

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

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readNextValue`](../../../interfaces/repositories.md#readnextvalue-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readNextValue`](Base.md#readnextvalue)

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
\| [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readOnlyOneByQuery`](../../../interfaces/repositories.md#readonlyonebyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOnlyOneByQuery`](Base.md#readonlyonebyquery)

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

`Promise`\<\[[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readOrCreateByQuery`](../../../interfaces/repositories.md#readorcreatebyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOrCreateByQuery`](Base.md#readorcreatebyquery)

##### readTransactionByStationIdAndTransactionId()

```ts
readTransactionByStationIdAndTransactionId(
   tenantId,
   stationId,
   transactionId): Promise<
  | Transaction
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:394](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L394)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `tenantId`      | `number` |
| `stationId`     | `string` |
| `transactionId` | `string` |

###### Returns

`Promise`\<
\| [`Transaction`](../model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`readTransactionByStationIdAndTransactionId`](../../../interfaces/repositories.md#readtransactionbystationidandtransactionid)

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

`Promise`\<[`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)[]\>

A promise that resolves to the updated values associated with the query.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`updateAllByQuery`](../../../interfaces/repositories.md#updateallbyquery-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateAllByQuery`](Base.md#updateallbyquery)

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
\| [`TransactionEvent`](../model/TransactionEvent/TransactionEvent.md#transactionevent)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`updateByKey`](../../../interfaces/repositories.md#updatebykey-21)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateByKey`](Base.md#updatebykey)

##### updateTransactionByMeterValues()

```ts
updateTransactionByMeterValues(
   tenantId,
   meterValues,
   stationId,
transactionId): Promise<void>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:604](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L604)

###### Parameters

| Parameter       | Type       |
| --------------- | ---------- |
| `tenantId`      | `number`   |
| `meterValues`   | `object`[] |
| `stationId`     | `string`   |
| `transactionId` | `number`   |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`updateTransactionByMeterValues`](../../../interfaces/repositories.md#updatetransactionbymetervalues)

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

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:790](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L790)

###### Parameters

| Parameter       | Type                                                                               |
| --------------- | ---------------------------------------------------------------------------------- |
| `tenantId`      | `number`                                                                           |
| `transaction`   | `Partial`\<[`Transaction`](../model/TransactionEvent/Transaction.md#transaction)\> |
| `transactionId` | `string`                                                                           |
| `stationId`     | `string`                                                                           |

###### Returns

`Promise`\<
\| [`Transaction`](../model/TransactionEvent/Transaction.md#transaction)
\| `undefined`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`updateTransactionByStationIdAndTransactionId`](../../../interfaces/repositories.md#updatetransactionbystationidandtransactionid)

##### updateTransactionTotalCostById()

```ts
updateTransactionTotalCostById(
   tenantId,
   totalCost,
id): Promise<void>;
```

Defined in: [01_Data/src/layers/sequelize/repository/TransactionEvent.ts:596](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/TransactionEvent.ts#L596)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `totalCost` | `number` |
| `id`        | `number` |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`ITransactionEventRepository`](../../../interfaces/repositories.md#itransactioneventrepository).[`updateTransactionTotalCostById`](../../../interfaces/repositories.md#updatetransactiontotalcostbyid)
