[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Transactions/src/module/CostCalculator

# 03_Modules/Transactions/src/module/CostCalculator

## Classes

### CostCalculator

Defined in: [03_Modules/Transactions/src/module/CostCalculator.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostCalculator.ts#L11)

#### Constructors

##### Constructor

```ts
new CostCalculator(
   tariffRepository,
   transactionService,
   logger?): CostCalculator;
```

Defined in: [03_Modules/Transactions/src/module/CostCalculator.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostCalculator.ts#L17)

###### Parameters

| Parameter            | Type                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `tariffRepository`   | `ITariffRepository`                                              |
| `transactionService` | [`TransactionService`](TransactionService.md#transactionservice) |
| `logger?`            | `Logger`\<`ILogObj`\>                                            |

###### Returns

[`CostCalculator`](#costcalculator)

#### Properties

| Property                                               | Modifier  | Type                                                             | Defined in                                                                                                                                                                                                    |
| ------------------------------------------------------ | --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`                         | `private` | `Logger`\<`ILogObj`\>                                            | [03_Modules/Transactions/src/module/CostCalculator.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostCalculator.ts#L12) |
| <a id="_tariffrepository"></a> `_tariffRepository`     | `private` | `ITariffRepository`                                              | [03_Modules/Transactions/src/module/CostCalculator.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostCalculator.ts#L14) |
| <a id="_transactionservice"></a> `_transactionService` | `private` | [`TransactionService`](TransactionService.md#transactionservice) | [03_Modules/Transactions/src/module/CostCalculator.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostCalculator.ts#L15) |

#### Methods

##### calculateTotalCost()

```ts
calculateTotalCost(
   tenantId,
   connectorId,
totalKwh): Promise<number>;
```

Defined in: [03_Modules/Transactions/src/module/CostCalculator.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Transactions/src/module/CostCalculator.ts#L39)

Calculates the total cost for a transaction.

Computes the cost based on `connectorId` and `totalKwh`.

###### Parameters

| Parameter     | Type                    | Description                       |
| ------------- | ----------------------- | --------------------------------- |
| `tenantId`    | `number`                | -                                 |
| `connectorId` | `number` \| `undefined` | The database ID of the connector. |
| `totalKwh`    | `number`                | The total kilowatt-hours.         |

###### Returns

`Promise`\<`number`\>

A promise that resolves to the total cost.
