[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/util/emaidCheckDigitCalculator

# 02_Util/src/util/emaidCheckDigitCalculator

## Functions

### calculateCheckDigit()

```ts
function calculateCheckDigit(emaidWithoutCheckDigit): string;
```

Defined in: [02_Util/src/util/emaidCheckDigitCalculator.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/emaidCheckDigitCalculator.ts#L18)

Calculate check digit for eMAID according to eMI³ specification
Based on the algorithm described in "Check Digit Calculation for Contract-IDs"

This implementation can detect five most frequent error types:

1. Single error: one character is wrong
2. Adjacent transposition: two adjacent characters are swapped
3. Twin error: two identical adjacent characters are both changed
4. Jump transposition: abc becomes cba
5. Jump twin error: aca becomes bcb

#### Parameters

| Parameter                | Type     | Description                                                |
| ------------------------ | -------- | ---------------------------------------------------------- |
| `emaidWithoutCheckDigit` | `string` | The first 14 characters of the eMAID (without check digit) |

#### Returns

`string`

The calculated check digit character
