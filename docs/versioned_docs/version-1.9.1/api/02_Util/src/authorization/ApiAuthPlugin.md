[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/authorization/ApiAuthPlugin

# 02_Util/src/authorization/ApiAuthPlugin

## Interfaces

### AuthPluginOptions

Defined in: [02_Util/src/authorization/ApiAuthPlugin.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/ApiAuthPlugin.ts#L15)

Options for the authentication plugin

#### Properties

| Property                                      | Type       | Description                              | Defined in                                                                                                                                                                                |
| --------------------------------------------- | ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="debug"></a> `debug?`                   | `boolean`  | Enable verbose debug logging             | [02_Util/src/authorization/ApiAuthPlugin.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/ApiAuthPlugin.ts#L24) |
| <a id="excludedroutes"></a> `excludedRoutes?` | `string`[] | Routes that don't require authentication | [02_Util/src/authorization/ApiAuthPlugin.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/ApiAuthPlugin.ts#L19) |

## Variables

### apiAuthPluginFp

```ts
const apiAuthPluginFp: FastifyPluginAsync<{
  logger?: Logger<ILogObj>;
  options?: AuthPluginOptions;
  provider: IApiAuthProvider;
}>;
```

Defined in: [02_Util/src/authorization/ApiAuthPlugin.ts:195](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/ApiAuthPlugin.ts#L195)
