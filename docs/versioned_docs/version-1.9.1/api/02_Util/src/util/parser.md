[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/util/parser

# 02_Util/src/util/parser

## Functions

### getBatches()

```ts
function getBatches(array, size): Map<number, number[] | string[] | object[] | boolean[]>;
```

Defined in: [02_Util/src/util/parser.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/parser.ts#L25)

Slice array into pieces according to the given size.

#### Parameters

| Parameter | Type                                                  | Description                   |
| --------- | ----------------------------------------------------- | ----------------------------- |
| `array`   | `number`[] \| `string`[] \| `object`[] \| `boolean`[] | An array.                     |
| `size`    | `number`                                              | The expected size of a batch. |

#### Returns

`Map`\<`number`, `number`[] \| `string`[] \| `object`[] \| `boolean`[]\>

A map with index as key and batch as value. Index is the position of the 1st batch element in the given
array. Batch is a subarray of the given array.

---

### getNumberOfFractionDigit()

```ts
function getNumberOfFractionDigit(num): number;
```

Defined in: [02_Util/src/util/parser.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/parser.ts#L50)

Get the number of fraction digits in a number, e.g, 1.23 -> 2

#### Parameters

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `num`     | `number` | The number to get the number of fraction digits |

#### Returns

`number`

The number of fraction digits

---

### getSizeOfRequest()

```ts
function getSizeOfRequest(request): number;
```

Defined in: [02_Util/src/util/parser.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/parser.ts#L13)

Calculate the size of a request.

#### Parameters

| Parameter | Type          | Description       |
| --------- | ------------- | ----------------- |
| `request` | `OcppRequest` | The ocpp request. |

#### Returns

`number`

The size of the request (Bytes).

---

### stringToSet()

```ts
function stringToSet(input): Set<string>;
```

Defined in: [02_Util/src/util/parser.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/parser.ts#L67)

Convert string to set. For example, 'a,b,c' -> new Set(['a', 'b', 'c'])

#### Parameters

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `input`   | `string` | The string to convert |

#### Returns

`Set`\<`string`\>

Set
