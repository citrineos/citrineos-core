[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/router/Authenticator

# 00_Base/src/interfaces/router/Authenticator

## Interfaces

### IAuthenticator

Defined in: [00_Base/src/interfaces/router/Authenticator.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/Authenticator.ts#L8)

#### Methods

##### authenticate()

```ts
authenticate(
   request,
   tenantId,
   options): Promise<{
  identifier: string;
}>;
```

Defined in: [00_Base/src/interfaces/router/Authenticator.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/Authenticator.ts#L9)

###### Parameters

| Parameter  | Type                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `request`  | `IncomingMessage`                                                         |
| `tenantId` | `number`                                                                  |
| `options`  | [`AuthenticationOptions`](AuthenticationOptions.md#authenticationoptions) |

###### Returns

`Promise`\<\{
`identifier`: `string`;
\}\>
