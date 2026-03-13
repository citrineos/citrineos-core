[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/dto/types/hours

# 00_Base/src/interfaces/dto/types/hours

## Classes

### LocationExceptionalPeriod

Defined in: [00_Base/src/interfaces/dto/types/hours.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L17)

#### Constructors

##### Constructor

```ts
new LocationExceptionalPeriod(): LocationExceptionalPeriod;
```

###### Returns

[`LocationExceptionalPeriod`](#locationexceptionalperiod)

#### Properties

| Property                               | Type   | Defined in                                                                                                                                                                              |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="periodbegin"></a> `periodBegin` | `Date` | [00_Base/src/interfaces/dto/types/hours.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L18) |
| <a id="periodend"></a> `periodEnd`     | `Date` | [00_Base/src/interfaces/dto/types/hours.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L19) |

---

### LocationHours

Defined in: [00_Base/src/interfaces/dto/types/hours.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L4)

#### Constructors

##### Constructor

```ts
new LocationHours(): LocationHours;
```

###### Returns

[`LocationHours`](#locationhours)

#### Properties

| Property                                                | Type                                                                  | Defined in                                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="exceptionalclosings"></a> `exceptionalClosings?` | [`LocationExceptionalPeriod`](#locationexceptionalperiod)[] \| `null` | [00_Base/src/interfaces/dto/types/hours.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L8) |
| <a id="exceptionalopenings"></a> `exceptionalOpenings?` | [`LocationExceptionalPeriod`](#locationexceptionalperiod)[] \| `null` | [00_Base/src/interfaces/dto/types/hours.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L7) |
| <a id="regularhours"></a> `regularHours?`               | [`LocationRegularHours`](#locationregularhours)[] \| `null`           | [00_Base/src/interfaces/dto/types/hours.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L5) |
| <a id="twentyfourseven"></a> `twentyfourSeven`          | `boolean`                                                             | [00_Base/src/interfaces/dto/types/hours.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L6) |

---

### LocationRegularHours

Defined in: [00_Base/src/interfaces/dto/types/hours.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L11)

#### Constructors

##### Constructor

```ts
new LocationRegularHours(): LocationRegularHours;
```

###### Returns

[`LocationRegularHours`](#locationregularhours)

#### Properties

| Property                                 | Type     | Defined in                                                                                                                                                                              |
| ---------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="periodbegin-1"></a> `periodBegin` | `string` | [00_Base/src/interfaces/dto/types/hours.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L13) |
| <a id="periodend-1"></a> `periodEnd`     | `string` | [00_Base/src/interfaces/dto/types/hours.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L14) |
| <a id="weekday"></a> `weekday`           | `number` | [00_Base/src/interfaces/dto/types/hours.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/types/hours.ts#L12) |
