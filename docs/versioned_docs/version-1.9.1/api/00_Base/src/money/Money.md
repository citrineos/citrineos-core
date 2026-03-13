[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/money/Money

# 00_Base/src/money/Money

## Classes

### Money

Defined in: [00_Base/src/money/Money.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L12)

#### Constructors

##### Constructor

```ts
private new Money(amount, currency): Money;
```

Defined in: [00_Base/src/money/Money.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L16)

###### Parameters

| Parameter  | Type                                |
| ---------- | ----------------------------------- |
| `amount`   | `string` \| `number` \| `Big`       |
| `currency` | [`CurrencySource`](#currencysource) |

###### Returns

[`Money`](#money)

#### Properties

| Property                           | Modifier  | Type                               | Defined in                                                                                                                                                |
| ---------------------------------- | --------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_amount"></a> `_amount`     | `private` | `Big`                              | [00_Base/src/money/Money.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L13) |
| <a id="_currency"></a> `_currency` | `private` | [`Currency`](Currency.md#currency) | [00_Base/src/money/Money.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L14) |

#### Accessors

##### amount

###### Get Signature

```ts
get amount(): Big;
```

Defined in: [00_Base/src/money/Money.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L27)

###### Returns

`Big`

##### currency

###### Get Signature

```ts
get currency(): Currency;
```

Defined in: [00_Base/src/money/Money.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L31)

###### Returns

[`Currency`](Currency.md#currency)

#### Methods

##### add()

```ts
add(money): Money;
```

Defined in: [00_Base/src/money/Money.ts:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L65)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

[`Money`](#money)

##### equals()

```ts
equals(money): boolean;
```

Defined in: [00_Base/src/money/Money.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L75)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

`boolean`

##### greaterThan()

```ts
greaterThan(money): boolean;
```

Defined in: [00_Base/src/money/Money.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L79)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

`boolean`

##### greaterThanOrEqual()

```ts
greaterThanOrEqual(money): boolean;
```

Defined in: [00_Base/src/money/Money.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L84)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

`boolean`

##### isNegative()

```ts
isNegative(): boolean;
```

Defined in: [00_Base/src/money/Money.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L107)

###### Returns

`boolean`

##### isPositive()

```ts
isPositive(): boolean;
```

Defined in: [00_Base/src/money/Money.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L103)

###### Returns

`boolean`

##### isZero()

```ts
isZero(): boolean;
```

Defined in: [00_Base/src/money/Money.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L99)

###### Returns

`boolean`

##### lessThan()

```ts
lessThan(money): boolean;
```

Defined in: [00_Base/src/money/Money.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L89)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

`boolean`

##### lessThanOrEqual()

```ts
lessThanOrEqual(money): boolean;
```

Defined in: [00_Base/src/money/Money.ts:94](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L94)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

`boolean`

##### multiply()

```ts
multiply(multiplier): Money;
```

Defined in: [00_Base/src/money/Money.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L61)

###### Parameters

| Parameter    | Type                          |
| ------------ | ----------------------------- |
| `multiplier` | `string` \| `number` \| `Big` |

###### Returns

[`Money`](#money)

##### requireSameCurrency()

```ts
private requireSameCurrency(money): void;
```

Defined in: [00_Base/src/money/Money.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L115)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

`void`

##### roundToCurrencyScale()

```ts
roundToCurrencyScale(): Money;
```

Defined in: [00_Base/src/money/Money.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L53)

Rounds the amount down to match the currency's defined scale.
This method could be used when converting an amount to its final monetary value.

###### Returns

[`Money`](#money)

A new Money instance with the amount rounded down to the currency's scale.

##### subtract()

```ts
subtract(money): Money;
```

Defined in: [00_Base/src/money/Money.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L70)

###### Parameters

| Parameter | Type              |
| --------- | ----------------- |
| `money`   | [`Money`](#money) |

###### Returns

[`Money`](#money)

##### toNumber()

```ts
toNumber(): number;
```

Defined in: [00_Base/src/money/Money.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L43)

###### Returns

`number`

##### withAmount()

```ts
private withAmount(amount): Money;
```

Defined in: [00_Base/src/money/Money.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L111)

###### Parameters

| Parameter | Type  |
| --------- | ----- |
| `amount`  | `Big` |

###### Returns

[`Money`](#money)

##### of()

```ts
static of(amount, currency): Money;
```

Defined in: [00_Base/src/money/Money.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L35)

###### Parameters

| Parameter  | Type                                |
| ---------- | ----------------------------------- |
| `amount`   | `string` \| `number` \| `Big`       |
| `currency` | [`CurrencySource`](#currencysource) |

###### Returns

[`Money`](#money)

##### USD()

```ts
static USD(amount): Money;
```

Defined in: [00_Base/src/money/Money.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L39)

###### Parameters

| Parameter | Type                          |
| --------- | ----------------------------- |
| `amount`  | `string` \| `number` \| `Big` |

###### Returns

[`Money`](#money)

## Type Aliases

### CurrencySource

```ts
type CurrencySource = string | CurrencyCode | Currency;
```

Defined in: [00_Base/src/money/Money.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Money.ts#L10)
