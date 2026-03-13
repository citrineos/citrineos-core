[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 01_Data/src/layers/sequelize/repository/DeviceModel

# 01_Data/src/layers/sequelize/repository/DeviceModel

## Classes

### SequelizeDeviceModelRepository

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L27)

#### Extends

- [`SequelizeRepository`](Base.md#sequelizerepository)\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)\>

#### Implements

- [`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository)

#### Constructors

##### Constructor

```ts
new SequelizeDeviceModelRepository(
   config,
   logger?,
   sequelizeInstance?,
   variable?,
   component?,
   evse?,
   componentVariable?,
   variableCharacteristics?,
   variableStatus?): SequelizeDeviceModelRepository;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L38)

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
| `variable?`                                | `CrudRepository`\<[`Variable`](../model/DeviceModel/Variable.md#variable)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `component?`                               | `CrudRepository`\<[`Component`](../model/DeviceModel/Component.md#component)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `evse?`                                    | `CrudRepository`\<[`EvseType`](../model/DeviceModel/EvseType.md#evsetype)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `componentVariable?`                       | `CrudRepository`\<[`ComponentVariable`](../model/DeviceModel/ComponentVariable.md#componentvariable)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `variableCharacteristics?`                 | `CrudRepository`\<[`VariableCharacteristics`](../model/DeviceModel/VariableCharacteristics.md#variablecharacteristics)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `variableStatus?`                          | `CrudRepository`\<[`VariableStatus`](../model/DeviceModel/VariableStatus.md#variablestatus)\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

###### Returns

[`SequelizeDeviceModelRepository`](#sequelizedevicemodelrepository)

###### Overrides

[`SequelizeRepository`](Base.md#sequelizerepository).[`constructor`](Base.md#constructor)

#### Properties

| Property                                                       | Modifier    | Type                                                                                                                     | Inherited from                                                                        | Defined in                                                                                                                                                                                                        |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="component"></a> `component`                             | `public`    | `CrudRepository`\<[`Component`](../model/DeviceModel/Component.md#component)\>                                           | -                                                                                     | [01_Data/src/layers/sequelize/repository/DeviceModel.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L32) |
| <a id="componentvariable"></a> `componentVariable`             | `public`    | `CrudRepository`\<[`ComponentVariable`](../model/DeviceModel/ComponentVariable.md#componentvariable)\>                   | -                                                                                     | [01_Data/src/layers/sequelize/repository/DeviceModel.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L35) |
| <a id="evse"></a> `evse`                                       | `public`    | `CrudRepository`\<[`EvseType`](../model/DeviceModel/EvseType.md#evsetype)\>                                              | -                                                                                     | [01_Data/src/layers/sequelize/repository/DeviceModel.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L33) |
| <a id="logger"></a> `logger`                                   | `protected` | `Logger`\<`ILogObj`\>                                                                                                    | [`SequelizeRepository`](Base.md#sequelizerepository).[`logger`](Base.md#logger)       | [01_Data/src/layers/sequelize/repository/Base.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L22)               |
| <a id="namespace"></a> `namespace`                             | `protected` | `string`                                                                                                                 | [`SequelizeRepository`](Base.md#sequelizerepository).[`namespace`](Base.md#namespace) | [01_Data/src/layers/sequelize/repository/Base.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L21)               |
| <a id="s"></a> `s`                                             | `protected` | `Sequelize`                                                                                                              | [`SequelizeRepository`](Base.md#sequelizerepository).[`s`](Base.md#s)                 | [01_Data/src/layers/sequelize/repository/Base.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L20)               |
| <a id="variable"></a> `variable`                               | `public`    | `CrudRepository`\<[`Variable`](../model/DeviceModel/Variable.md#variable)\>                                              | -                                                                                     | [01_Data/src/layers/sequelize/repository/DeviceModel.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L31) |
| <a id="variablecharacteristics"></a> `variableCharacteristics` | `public`    | `CrudRepository`\<[`VariableCharacteristics`](../model/DeviceModel/VariableCharacteristics.md#variablecharacteristics)\> | -                                                                                     | [01_Data/src/layers/sequelize/repository/DeviceModel.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L34) |
| <a id="variablestatus"></a> `variableStatus`                   | `public`    | `CrudRepository`\<[`VariableStatus`](../model/DeviceModel/VariableStatus.md#variablestatus)\>                            | -                                                                                     | [01_Data/src/layers/sequelize/repository/DeviceModel.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L36) |

#### Methods

##### \_bulkCreate()

```ts
protected _bulkCreate(
   tenantId,
   values,
namespace?): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L115)

###### Parameters

| Parameter   | Type                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| `tenantId`  | `number`                                                                             |
| `values`    | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[] |
| `namespace` | `string`                                                                             |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_bulkCreate`](../../../interfaces/repositories.md#_bulkcreate-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_bulkCreate`](Base.md#_bulkcreate)

##### \_create()

```ts
protected _create(
   tenantId,
   value,
_namespace?): Promise<VariableAttribute>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L107)

###### Parameters

| Parameter    | Type                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `tenantId`   | `number`                                                                           |
| `value`      | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute) |
| `_namespace` | `string`                                                                           |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_create`](../../../interfaces/repositories.md#_create-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_create`](Base.md#_create)

##### \_createByKey()

```ts
protected _createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableAttribute>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L123)

###### Parameters

| Parameter   | Type                                                                               |
| ----------- | ---------------------------------------------------------------------------------- |
| `tenantId`  | `number`                                                                           |
| `value`     | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute) |
| `key`       | `string`                                                                           |
| `namespace` | `string`                                                                           |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_createByKey`](../../../interfaces/repositories.md#_createbykey-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_createByKey`](Base.md#_createbykey)

##### \_deleteAllByQuery()

```ts
protected _deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:218](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L218)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_deleteAllByQuery`](../../../interfaces/repositories.md#_deleteallbyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteAllByQuery`](Base.md#_deleteallbyquery)

##### \_deleteByKey()

```ts
protected _deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | VariableAttribute
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
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_deleteByKey`](../../../interfaces/repositories.md#_deletebykey-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_deleteByKey`](Base.md#_deletebykey)

##### \_readOrCreateByQuery()

```ts
protected _readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[VariableAttribute, boolean]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/Base.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/Base.ts#L134)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `query`     | `object` |
| `namespace` | `string` |

###### Returns

`Promise`\<\[[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute), `boolean`\]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_readOrCreateByQuery`](../../../interfaces/repositories.md#_readorcreatebyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_readOrCreateByQuery`](Base.md#_readorcreatebyquery)

##### \_updateAllByQuery()

```ts
protected _updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<VariableAttribute[]>;
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

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_updateAllByQuery`](../../../interfaces/repositories.md#_updateallbyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateAllByQuery`](Base.md#_updateallbyquery)

##### \_updateByKey()

```ts
protected _updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | VariableAttribute
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
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`_updateByKey`](../../../interfaces/repositories.md#_updatebykey-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`_updateByKey`](Base.md#_updatebykey)

##### bulkCreate()

```ts
bulkCreate(
   tenantId,
   values,
   clazz,
namespace?): Promise<VariableAttribute[]>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:48

Creates multiple entries in the database.

###### Parameters

| Parameter    | Type                                                                                 | Description                                      |
| ------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `tenantId`   | `number`                                                                             | The tenant ID for which to create the entries.   |
| `values`     | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[] | The values of the entries.                       |
| `clazz`      | `any`                                                                                | The class of the model.                          |
| `namespace?` | `string`                                                                             | The optional namespace to create the entries in. |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

A Promise that resolves to the created entries.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`bulkCreate`](../../../interfaces/repositories.md#bulkcreate-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`bulkCreate`](Base.md#bulkcreate)

##### constructQuery()

```ts
private constructQuery(queryParams): any;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:552](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L552)

###### Parameters

| Parameter     | Type                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `queryParams` | [`VariableAttributeQuerystring`](../../../interfaces/queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`any`

##### create()

```ts
create(
   tenantId,
   value,
namespace?): Promise<VariableAttribute>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:38

Creates a new entry in the database with the specified value.

###### Parameters

| Parameter    | Type                                                                               | Description                                    |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                           | The tenant ID for which to create the entry.   |
| `value`      | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute) | The value of the entry.                        |
| `namespace?` | `string`                                                                           | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)\>

A Promise that resolves to the created entry.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`create`](../../../interfaces/repositories.md#create-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`create`](Base.md#create)

##### createByKey()

```ts
createByKey(
   tenantId,
   value,
   key,
namespace?): Promise<VariableAttribute>;
```

Defined in: 00_Base/dist/interfaces/repository.d.ts:58

Creates a new entry in the database with the specified value and key.

###### Parameters

| Parameter    | Type                                                                               | Description                                    |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| `tenantId`   | `number`                                                                           | The tenant ID for which to create the entry.   |
| `value`      | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute) | The value of the entry.                        |
| `key`        | `string`                                                                           | The key of the entry.                          |
| `namespace?` | `string`                                                                           | The optional namespace to create the entry in. |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)\>

A Promise that resolves to the created entry.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`createByKey`](../../../interfaces/repositories.md#createbykey-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`createByKey`](Base.md#createbykey)

##### createOrUpdateByGetVariablesResultAndStationId()

```ts
createOrUpdateByGetVariablesResultAndStationId(
   tenantId,
   getVariablesResult,
   stationId,
isoTimestamp): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:288](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L288)

###### Parameters

| Parameter            | Type                      |
| -------------------- | ------------------------- |
| `tenantId`           | `number`                  |
| `getVariablesResult` | `GetVariableResultType`[] |
| `stationId`          | `string`                  |
| `isoTimestamp`       | `string`                  |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`createOrUpdateByGetVariablesResultAndStationId`](../../../interfaces/repositories.md#createorupdatebygetvariablesresultandstationid)

##### createOrUpdateBySetVariablesDataAndStationId()

```ts
createOrUpdateBySetVariablesDataAndStationId(
   tenantId,
   setVariablesData,
   stationId,
isoTimestamp): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:335](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L335)

###### Parameters

| Parameter          | Type                    |
| ------------------ | ----------------------- |
| `tenantId`         | `number`                |
| `setVariablesData` | `SetVariableDataType`[] |
| `stationId`        | `string`                |
| `isoTimestamp`     | `string`                |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`createOrUpdateBySetVariablesDataAndStationId`](../../../interfaces/repositories.md#createorupdatebysetvariablesdataandstationid)

##### createOrUpdateDeviceModelByStationId()

```ts
createOrUpdateDeviceModelByStationId(
   tenantId,
   value,
   stationId,
isoTimestamp): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L85)

###### Parameters

| Parameter      | Type             |
| -------------- | ---------------- |
| `tenantId`     | `number`         |
| `value`        | `ReportDataType` |
| `stationId`    | `string`         |
| `isoTimestamp` | `string`         |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`createOrUpdateDeviceModelByStationId`](../../../interfaces/repositories.md#createorupdatedevicemodelbystationid)

##### createSetVariableDataType()

```ts
private createSetVariableDataType(input): SetVariableDataType;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:533](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L533)

Private Methods

###### Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `input`   | [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute) |

###### Returns

`SetVariableDataType`

##### deleteAllByQuery()

```ts
deleteAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttribute[]>;
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

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

A Promise that resolves to the deleted entries.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`deleteAllByQuery`](../../../interfaces/repositories.md#deleteallbyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`deleteAllByQuery`](Base.md#deleteallbyquery)

##### deleteAllByQuerystring()

```ts
deleteAllByQuerystring(tenantId, query): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:459](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L459)

###### Parameters

| Parameter  | Type                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                                                        |
| `query`    | [`VariableAttributeQuerystring`](../../../interfaces/queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`deleteAllByQuerystring`](../../../interfaces/repositories.md#deleteallbyquerystring)

##### deleteByKey()

```ts
deleteByKey(
   tenantId,
   key,
   namespace?): Promise<
  | VariableAttribute
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
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

A Promise that resolves to the deleted entry, or undefined there was no matching entry.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`deleteByKey`](../../../interfaces/repositories.md#deletebykey-8)

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

| Parameter | Type                                                                                                     | Description                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `event`   | `K`                                                                                                      | The name of the event. Must be a key in CrudEvent.                                                            |
| ...`args` | `CrudEvent`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)\>\[`K`\] | The arguments to pass with the event. Allowed types correspond to the contents of the event key in CrudEvent. |

###### Returns

`boolean`

###### See

EventEmitter#emit for the original method.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`emit`](../../../interfaces/repositories.md#emit-8)

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

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`existByQuery`](../../../interfaces/repositories.md#existbyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existByQuery`](Base.md#existbyquery)

##### existByQuerystring()

```ts
existByQuerystring(tenantId, query): Promise<number>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:455](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L455)

###### Parameters

| Parameter  | Type                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                                                        |
| `query`    | [`VariableAttributeQuerystring`](../../../interfaces/queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`Promise`\<`number`\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`existByQuerystring`](../../../interfaces/repositories.md#existbyquerystring)

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

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`existsByKey`](../../../interfaces/repositories.md#existsbykey-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`existsByKey`](Base.md#existsbykey)

##### findAndCount()

```ts
findAndCount(
   tenantId,
   options,
   namespace?): Promise<{
  count: number;
  rows: VariableAttribute[];
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
`rows`: [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[];
\}\>

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`findAndCount`](Base.md#findandcount)

##### findComponentAndVariable()

```ts
findComponentAndVariable(
   tenantId,
   componentType,
variableType): Promise<[Component | undefined, Variable | undefined]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:466](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L466)

###### Parameters

| Parameter       | Type            |
| --------------- | --------------- |
| `tenantId`      | `number`        |
| `componentType` | `ComponentType` |
| `variableType`  | `VariableType`  |

###### Returns

`Promise`\<\[[`Component`](../model/DeviceModel/Component.md#component) \| `undefined`, [`Variable`](../model/DeviceModel/Variable.md#variable) \| `undefined`\]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`findComponentAndVariable`](../../../interfaces/repositories.md#findcomponentandvariable)

##### findEvseByIdAndConnectorId()

```ts
findEvseByIdAndConnectorId(
   tenantId,
   id,
connectorId): Promise<EvseType | undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:496](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L496)

###### Parameters

| Parameter     | Type               |
| ------------- | ------------------ |
| `tenantId`    | `number`           |
| `id`          | `number`           |
| `connectorId` | `number` \| `null` |

###### Returns

`Promise`\<[`EvseType`](../model/DeviceModel/EvseType.md#evsetype) \| `undefined`\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`findEvseByIdAndConnectorId`](../../../interfaces/repositories.md#findevsebyidandconnectorid)

##### findOrCreateEvseAndComponent()

```ts
findOrCreateEvseAndComponent(
   tenantId,
   componentType,
stationId?): Promise<Component>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:220](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L220)

###### Parameters

| Parameter       | Type            |
| --------------- | --------------- |
| `tenantId`      | `number`        |
| `componentType` | `ComponentType` |
| `stationId?`    | `string`        |

###### Returns

`Promise`\<[`Component`](../model/DeviceModel/Component.md#component)\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`findOrCreateEvseAndComponent`](../../../interfaces/repositories.md#findorcreateevseandcomponent)

##### findOrCreateEvseAndComponentAndVariable()

```ts
findOrCreateEvseAndComponentAndVariable(
   tenantId,
   componentType,
   variableType,
stationId?): Promise<[Component, Variable]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:193](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L193)

###### Parameters

| Parameter       | Type            |
| --------------- | --------------- |
| `tenantId`      | `number`        |
| `componentType` | `ComponentType` |
| `variableType`  | `VariableType`  |
| `stationId?`    | `string`        |

###### Returns

`Promise`\<\[[`Component`](../model/DeviceModel/Component.md#component), [`Variable`](../model/DeviceModel/Variable.md#variable)\]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`findOrCreateEvseAndComponentAndVariable`](../../../interfaces/repositories.md#findorcreateevseandcomponentandvariable)

##### findVariableCharacteristicsByVariableNameAndVariableInstance()

```ts
findVariableCharacteristicsByVariableNameAndVariableInstance(
   tenantId,
   variableName,
   variableInstance): Promise<
  | VariableCharacteristics
| undefined>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:510](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L510)

###### Parameters

| Parameter          | Type               |
| ------------------ | ------------------ |
| `tenantId`         | `number`           |
| `variableName`     | `string`           |
| `variableInstance` | `string` \| `null` |

###### Returns

`Promise`\<
\| [`VariableCharacteristics`](../model/DeviceModel/VariableCharacteristics.md#variablecharacteristics)
\| `undefined`\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`findVariableCharacteristicsByVariableNameAndVariableInstance`](../../../interfaces/repositories.md#findvariablecharacteristicsbyvariablenameandvariableinstance)

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

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`on`](../../../interfaces/repositories.md#on-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`on`](Base.md#on)

##### readAllByQuery()

```ts
readAllByQuery(
   tenantId,
   query,
namespace?): Promise<VariableAttribute[]>;
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

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

A promise that resolves to the values associated with the query.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readAllByQuery`](../../../interfaces/repositories.md#readallbyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readAllByQuery`](Base.md#readallbyquery)

##### readAllByQuerystring()

```ts
readAllByQuerystring(tenantId, query): Promise<VariableAttribute[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:446](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L446)

###### Parameters

| Parameter  | Type                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `tenantId` | `number`                                                                                                        |
| `query`    | [`VariableAttributeQuerystring`](../../../interfaces/queries/VariableAttribute.md#variableattributequerystring) |

###### Returns

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readAllByQuerystring`](../../../interfaces/repositories.md#readallbyquerystring-1)

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

##### readAllSetVariableByStationId()

```ts
readAllSetVariableByStationId(tenantId, stationId): Promise<SetVariableDataType[]>;
```

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:429](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L429)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`SetVariableDataType`[]\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readAllSetVariableByStationId`](../../../interfaces/repositories.md#readallsetvariablebystationid)

##### readByKey()

```ts
readByKey(
   tenantId,
   key,
   namespace?): Promise<
  | VariableAttribute
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
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

A promise that resolves to the value associated with the key, or undefined if the key does not exist.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readByKey`](../../../interfaces/repositories.md#readbykey-8)

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

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readNextValue`](../../../interfaces/repositories.md#readnextvalue-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readNextValue`](Base.md#readnextvalue)

##### readOnlyOneByQuery()

```ts
readOnlyOneByQuery(
   tenantId,
   query,
   namespace?): Promise<
  | VariableAttribute
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
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

A promise that resolves to the value associated with the query if it exists. An exception is thrown if more than one value is found.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readOnlyOneByQuery`](../../../interfaces/repositories.md#readonlyonebyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOnlyOneByQuery`](Base.md#readonlyonebyquery)

##### readOrCreateByQuery()

```ts
readOrCreateByQuery(
   tenantId,
   query,
namespace?): Promise<[VariableAttribute, boolean]>;
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

`Promise`\<\[[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute), `boolean`\]\>

A promise that resolves to an array where the first element is the value associated with the query, either an existing value or the newly created value, and the second element is a boolean indicating whether the entry was created.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`readOrCreateByQuery`](../../../interfaces/repositories.md#readorcreatebyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`readOrCreateByQuery`](Base.md#readorcreatebyquery)

##### updateAllByQuery()

```ts
updateAllByQuery(
   tenantId,
   value,
   query,
namespace?): Promise<VariableAttribute[]>;
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

`Promise`\<[`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)[]\>

A promise that resolves to the updated values associated with the query.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`updateAllByQuery`](../../../interfaces/repositories.md#updateallbyquery-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateAllByQuery`](Base.md#updateallbyquery)

##### updateByKey()

```ts
updateByKey(
   tenantId,
   value,
   key,
   namespace?): Promise<
  | VariableAttribute
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
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

A promise that resolves to the updated value, or undefined if the key does not exist.

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`updateByKey`](../../../interfaces/repositories.md#updatebykey-8)

###### Inherited from

[`SequelizeRepository`](Base.md#sequelizerepository).[`updateByKey`](Base.md#updatebykey)

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

Defined in: [01_Data/src/layers/sequelize/repository/DeviceModel.ts:369](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/repository/DeviceModel.ts#L369)

###### Parameters

| Parameter      | Type                    |
| -------------- | ----------------------- |
| `tenantId`     | `number`                |
| `result`       | `SetVariableResultType` |
| `stationId`    | `string`                |
| `isoTimestamp` | `string`                |

###### Returns

`Promise`\<
\| [`VariableAttribute`](../model/DeviceModel/VariableAttribute.md#variableattribute)
\| `undefined`\>

###### Implementation of

[`IDeviceModelRepository`](../../../interfaces/repositories.md#idevicemodelrepository).[`updateResultByStationId`](../../../interfaces/repositories.md#updateresultbystationid)
