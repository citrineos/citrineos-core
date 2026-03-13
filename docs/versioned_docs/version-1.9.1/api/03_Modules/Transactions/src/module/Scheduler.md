[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Transactions/src/module/Scheduler

# 03_Modules/Transactions/src/module/Scheduler

## Classes

### `abstract` Scheduler

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L7)

#### Extended by

- [`CostNotifier`](CostNotifier.md#costnotifier)

#### Constructors

##### Constructor

```ts
new Scheduler(logger?): Scheduler;
```

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L12)

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `logger?` | `Logger`\<`ILogObj`\> |

###### Returns

[`Scheduler`](#abstract-scheduler)

#### Properties

| Property                           | Modifier   | Type                         | Defined in                                                                                                                                                                                          |
| ---------------------------------- | ---------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`     | `readonly` | `Logger`\<`ILogObj`\>        | [03_Modules/Transactions/src/module/Scheduler.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L8)   |
| <a id="_registry"></a> `_registry` | `private`  | `Map`\<`string`, `Timeout`\> | [03_Modules/Transactions/src/module/Scheduler.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L10) |

#### Methods

##### \_isAlreadyRegistered()

```ts
private _isAlreadyRegistered(key): boolean;
```

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L44)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `key`     | `string` |

###### Returns

`boolean`

##### \_register()

```ts
private _register(key, timeout): void;
```

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L35)

###### Parameters

| Parameter | Type      |
| --------- | --------- |
| `key`     | `string`  |
| `timeout` | `Timeout` |

###### Returns

`void`

##### \_unregister()

```ts
private _unregister(key): void;
```

Defined in: [03_Modules/Transactions/src/module/Scheduler.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/Scheduler.ts#L39)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `key`     | `string` |

###### Returns

`void`

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
