[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Transactions/src/module/CostNotifier

# 03_Modules/Transactions/src/module/CostNotifier

## Classes

### CostNotifier

Defined in: [03_Modules/Transactions/src/module/CostNotifier.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L12)

#### Extends

- [`Scheduler`](Scheduler.md#abstract-scheduler)

#### Constructors

##### Constructor

```ts
new CostNotifier(
   module,
   transactionEventRepository,
   costCalculator,
   logger?): CostNotifier;
```

Defined in: [03_Modules/Transactions/src/module/CostNotifier.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L17)

###### Parameters

| Parameter                    | Type                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `module`                     | `AbstractModule`                                     |
| `transactionEventRepository` | `ITransactionEventRepository`                        |
| `costCalculator`             | [`CostCalculator`](CostCalculator.md#costcalculator) |
| `logger?`                    | `Logger`\<`ILogObj`\>                                |

###### Returns

[`CostNotifier`](#costnotifier)

###### Overrides

[`Scheduler`](Scheduler.md#abstract-scheduler).[`constructor`](Scheduler.md#constructor)

#### Properties

| Property                                                               | Modifier   | Type                                                 | Inherited from                                                                   | Defined in                                                                                                                                                                                                |
| ---------------------------------------------------------------------- | ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_costcalculator"></a> `_costCalculator`                         | `private`  | [`CostCalculator`](CostCalculator.md#costcalculator) | -                                                                                | [03_Modules/Transactions/src/module/CostNotifier.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L15) |
| <a id="_logger"></a> `_logger`                                         | `readonly` | `Logger`\<`ILogObj`\>                                | [`Scheduler`](Scheduler.md#abstract-scheduler).[`_logger`](Scheduler.md#_logger) | [03_Modules/Transactions/src/module/Scheduler.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L8)         |
| <a id="_module"></a> `_module`                                         | `private`  | `AbstractModule`                                     | -                                                                                | [03_Modules/Transactions/src/module/CostNotifier.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L14) |
| <a id="_transactioneventrepository"></a> `_transactionEventRepository` | `private`  | `ITransactionEventRepository`                        | -                                                                                | [03_Modules/Transactions/src/module/CostNotifier.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L13) |

#### Methods

##### \_key()

```ts
private _key(stationId, transactionId): string;
```

Defined in: [03_Modules/Transactions/src/module/CostNotifier.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L106)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `stationId`     | `string` |
| `transactionId` | `string` |

###### Returns

`string`

##### \_tryNotify()

```ts
private _tryNotify(
   stationId,
   transactionId,
tenantId): Promise<void>;
```

Defined in: [03_Modules/Transactions/src/module/CostNotifier.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L83)

###### Parameters

| Parameter       | Type     |
| --------------- | -------- |
| `stationId`     | `string` |
| `transactionId` | `string` |
| `tenantId`      | `number` |

###### Returns

`Promise`\<`void`\>

##### calculateCostAndNotify()

```ts
calculateCostAndNotify(transaction, tenantId): Promise<void>;
```

Defined in: [03_Modules/Transactions/src/module/CostNotifier.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L55)

###### Parameters

| Parameter     | Type          |
| ------------- | ------------- |
| `transaction` | `Transaction` |
| `tenantId`    | `number`      |

###### Returns

`Promise`\<`void`\>

##### notifyWhileActive()

```ts
notifyWhileActive(
   stationId,
   transactionId,
   tenantId,
   intervalSeconds): void;
```

Defined in: [03_Modules/Transactions/src/module/CostNotifier.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostNotifier.ts#L39)

Repeatedly sends a CostUpdated call for an ongoing transaction based on the intervalSeconds.
Stops sending requests once the transaction becomes inactive.

###### Parameters

| Parameter         | Type     | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `stationId`       | `string` | The identifier of the client connection. |
| `transactionId`   | `string` | The identifier of the transaction.       |
| `tenantId`        | `number` | The identifier of the tenant.            |
| `intervalSeconds` | `number` | The costUpdated interval in seconds.     |

###### Returns

`void`

This function does not return anything.

##### schedule()

```ts
protected schedule(
   key,
   task,
   intervalSeconds): void;
```

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L18)

###### Parameters

| Parameter         | Type         |
| ----------------- | ------------ |
| `key`             | `string`     |
| `task`            | () => `void` |
| `intervalSeconds` | `number`     |

###### Returns

`void`

###### Inherited from

[`Scheduler`](Scheduler.md#abstract-scheduler).[`schedule`](Scheduler.md#schedule)

##### unschedule()

```ts
protected unschedule(key): void;
```

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L30)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `key`     | `string` |

###### Returns

`void`

###### Inherited from

[`Scheduler`](Scheduler.md#abstract-scheduler).[`unschedule`](Scheduler.md#unschedule)
