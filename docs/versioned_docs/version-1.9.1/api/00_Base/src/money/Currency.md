[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/money/Currency

# 00_Base/src/money/Currency

## Classes

### Currency

Defined in: [00_Base/src/money/Currency.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L51)

Represents a currency with decimal precision.

To add support for a currency:

1.  Add the new currency code to the CURRENCY_CODES array.
2.  Create a corresponding mapping in the [SUPPORTED_CURRENCIES](#supported_currencies) map.

#### Constructors

##### Constructor

```ts
new Currency(code, scale): Currency;
```

Defined in: [00_Base/src/money/Currency.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L62)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `code`    | `string` |
| `scale`   | `number` |

###### Returns

[`Currency`](#currency)

#### Properties

| Property                                                 | Modifier  | Type                                     | Defined in                                                                                                                                                      |
| -------------------------------------------------------- | --------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_code"></a> `_code`                               | `private` | `"USD"` \| `"EUR"` \| `"CAD"` \| `"GBP"` | [00_Base/src/money/Currency.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L59) |
| <a id="_scale"></a> `_scale`                             | `private` | `2`                                      | [00_Base/src/money/Currency.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L60) |
| <a id="supported_currencies"></a> `SUPPORTED_CURRENCIES` | `private` | `CurrencyMap`                            | [00_Base/src/money/Currency.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L52) |

#### Accessors

##### code

###### Get Signature

```ts
get code(): "USD" | "EUR" | "CAD" | "GBP";
```

Defined in: [00_Base/src/money/Currency.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L67)

###### Returns

`"USD"` \| `"EUR"` \| `"CAD"` \| `"GBP"`

##### scale

###### Get Signature

```ts
get scale(): 2;
```

Defined in: [00_Base/src/money/Currency.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L71)

###### Returns

`2`

#### Methods

##### of()

```ts
static of(code): Currency;
```

Defined in: [00_Base/src/money/Currency.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L75)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `code`    | `string` |

###### Returns

[`Currency`](#currency)

## Type Aliases

### CurrencyCode

```ts
type CurrencyCode = (typeof CURRENCY_CODES)[number];
```

Defined in: [00_Base/src/money/Currency.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L11)

## Functions

### currencyCode()

```ts
function currencyCode(value): 'USD' | 'EUR' | 'CAD' | 'GBP';
```

Defined in: [00_Base/src/money/Currency.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L17)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `string` |

#### Returns

`"USD"` \| `"EUR"` \| `"CAD"` \| `"GBP"`

---

### currencyScale()

```ts
function currencyScale(value): 2;
```

Defined in: [00_Base/src/money/Currency.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L35)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `number` |

#### Returns

`2`

---

### isCurrencyCode()

```ts
function isCurrencyCode(value): value is 'USD' | 'EUR' | 'CAD' | 'GBP';
```

Defined in: [00_Base/src/money/Currency.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L13)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `string` |

#### Returns

value is "USD" \| "EUR" \| "CAD" \| "GBP"

---

### isCurrencyScale()

```ts
function isCurrencyScale(value): value is 2;
```

Defined in: [00_Base/src/money/Currency.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/money/Currency.ts#L31)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `value`   | `number` |

#### Returns

`value is 2`
