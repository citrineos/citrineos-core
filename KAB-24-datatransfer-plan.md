# KAB-24 — DataTransfer handler: parse, store, respond

## Goal

Stop blanket-`Rejected`ing OCPP `DataTransfer`. Instead: persist **every** DataTransfer
(raw + best-effort parsed), and respond `Accepted` **only when we recognized and stored a
parsed payload**, else the correct rejection status. All in `citrineos-core`; storage in the
Citrine Postgres.

## Decisions (locked)

- **Store everything.** Raw envelope unconditionally; parsed view alongside when we can.
  Never drop, never throw on a parse failure.
- **Respond:** `Accepted` iff we parsed + stored a recognized payload. Otherwise:
  - unknown `vendorId` → `UnknownVendor` (1.6) / `Rejected`+`NotImplemented` (2.0.1), **no data field**
  - known vendor, unknown `messageId` → `UnknownMessageId`
  - recognized but payload unparseable / business reject → `Rejected`
- **Storage = Citrine DB**, new table `DataTransferData` (Sequelize model + migration).
- **Handler** = extend the existing `Configuration` module handlers (both 1.6 and 2.0.1).

---

## 1. Current state

`03_Modules/Configuration/src/module/module.ts`
- `_handleOcpp16DataTransfer` (L1072) → hardcoded `status: Rejected`, nothing else.
- `_handleDataTransfer` (2.0.1, L758) → `Rejected` + `NotImplemented`, nothing else.
- Raw message is *already* persisted to `OCPPMessages` at the router layer (both directions),
  so the new table is the **parsed/structured layer on top** — we are not duplicating the raw log.

Prod reality (from Hasura, 5,220 charger→CSMS DataTransfers, **0** ever `Accepted`):

| Charger family | Stations | vendorId | messageId | data (string) | Use |
|---|---|---|---|---|---|
| Weili "wl" | k_kacyiru_*, k_kanombe_* | `wl` | `vidInfoReport` | `{transactionId, connecterId, vid, timestamp}` | vehicle/RFID ↔ tx |
| ChargeFairy | k_sichey_* | `com.chargefairy` | `soc`, `power`, `Location` | `{soc:10.0}`, `{power:-1024.0}`, `{lat,lng,alt}` | live SoC/power/GPS |
| legacy | e_kacyiru_1 | `<rfid#>` | `""` | `"QueryCard"` | RFID auth probe |
| ABB-type | e_kacyiru_2 | — | — | none | n/a |

**Data-quality traps (must handle):**
- `wl` `data` is **malformed JSON**: `"vid":"1063A350C4E8,` — unclosed quote. `JSON.parse` throws.
- `vid = 01FF00000000` is a **placeholder** (no card) — flag, don't treat as a real vehicle.
- Per spec, `data` is an arbitrary string: may be JSON, escaped-JSON, base64-JSON, or plain text.
  Some firmwares ignore our response status entirely. Never assume.

---

## 2. Storage — `DataTransferData`

New Sequelize model `01_Data/src/layers/sequelize/model/DataTransferData.ts`, extending
`BaseModelWithTenant` (gives `tenantId`), registered in `model/index.ts`.

Columns:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `tenantId` | int | from `BaseModelWithTenant` |
| `stationId` | string | `message.context.stationId` |
| `ocppMessageId` | string | the RPC `[2,"<uid>",...]` id — joins to `OCPPMessages` |
| `direction` | enum `CP_TO_CSMS` \| `CSMS_TO_CP` | |
| `ocppVersion` | enum `1.6` \| `2.0.1` | |
| `vendorId` | string(≤255) | |
| `messageId` | string(≤50) nullable | |
| `dataRaw` | TEXT nullable | exact string received, untouched |
| `dataParsed` | JSONB nullable | only when parse succeeded |
| `dataEncoding` | enum `json`\|`escaped-json`\|`base64-json`\|`text`\|`unknown` | |
| `parser` | string nullable | which vendor parser matched (e.g. `wl:vidInfoReport`) |
| `responseStatus` | string | what we returned |
| `responseData` | TEXT nullable | data we sent back, if any |
| `transactionDbId` | int nullable FK→Transactions | resolved when payload carries a tx |
| `vid` | string nullable | extracted vehicle id (wl) |
| `createdAt`/`updatedAt` | timestamptz | Sequelize default |

Indexes: `(vendorId, messageId)` (doubles as routing-registry lookup), `(stationId, createdAt DESC)`, GIN on `dataParsed`, `(transactionDbId)`.

Migration: `migrations/20260603xxxxxx-create-data-transfer-data.ts` (follow existing
`YYYYMMDDHHMMSS-desc.ts` convention).

Repository: `IDataTransferRepository` + `SequelizeDataTransferRepository`
(`01_Data/src/layers/sequelize/repository/DataTransfer.ts`), exported from `01_Data/src/index.ts`,
mirroring `OCPPMessage` repo. Inject into `ConfigurationModule` constructor exactly like
`IOCPPMessageRepository` already is (L39/L51).

---

## 3. Parsing pipeline (defensive, never throws)

```
parseDataField(raw):
  if raw == null            -> { parsed: null, encoding: 'text' }
  try JSON.parse(raw)       -> { parsed, encoding: 'json' }
  try JSON.parse(repair(raw)) // tolerant: close dangling quotes (wl bug)
                            -> { parsed, encoding: 'escaped-json' }
  try base64 -> JSON.parse  -> { parsed, encoding: 'base64-json' }
  else                      -> { parsed: null, encoding: 'text'|'unknown' }
  // every branch wrapped in try/catch; failure is a logged event, not a throw
```

## 4. Vendor registry (table- or map-driven, no redeploy to log a new vendor)

```
registry: Map<`${vendorId}:${messageId}`, parserFn>
  'wl:vidInfoReport'            -> extract {transactionId, connectorId, vid, timestamp};
                                   treat vid '01FF00000000' as placeholder=true
  'com.chargefairy:soc'         -> { soc }
  'com.chargefairy:power'       -> { power }
  'com.chargefairy:Location'    -> { lat, lng, alt }
  '*:QueryCard' (legacy)        -> { card: vendorId }  // confirm still live before investing
```
- Vendor known + messageId in registry + parse OK → store parsed, set `parser`, respond `Accepted`.
- Vendor known, messageId not in registry → store raw, respond `UnknownMessageId`.
- Vendor not known → store raw, respond `UnknownVendor` (1.6) / `Rejected`+`NotImplemented` (2.0.1), no data.
- Recognized but unparseable → store raw, respond `Rejected`.

> Wrapped-message families (ISO 15118 / pricing) use inverted convention: envelope `Accepted`
> unless wholly unparseable, real sub-status inside `data`. Not in scope for KAB-24 vendors; note
> for future so envelope-status and inner-status stay separate concepts in code.

## 5. Handler shape (both versions)

Replace the bodies of `_handleOcpp16DataTransfer` (L1072) and `_handleDataTransfer` (L758):

```ts
if (message.state === MessageState.Request) {
  const { vendorId, messageId, data } = message.payload;
  const { stationId, tenantId } = message.context;
  const { parsed, encoding } = parseDataField(data);
  const hit = registry.get(`${vendorId}:${messageId ?? ''}`);
  let status; let parserName = null; let txDbId = null; let vid = null;

  if (!isKnownVendor(vendorId))      status = UnknownVendor;       // 2.0.1: Rejected+NotImplemented
  else if (!hit)                     status = UnknownMessageId;
  else if (!parsed)                  status = Rejected;
  else {
    const out = hit(parsed);         // {vid, transactionId, soc, ...}
    parserName = hit.name; vid = out.vid ?? null;
    txDbId = await resolveTxDbId(tenantId, stationId, out);  // best-effort
    status = Accepted;
  }

  await this._dataTransferRepository.create(tenantId, {
    stationId, ocppMessageId: message.context.correlationId ?? message.id,
    direction: 'CP_TO_CSMS', ocppVersion, vendorId, messageId,
    dataRaw: data ?? null, dataParsed: parsed, dataEncoding: encoding,
    parser: parserName, responseStatus: status, transactionDbId: txDbId, vid,
  });

  await this.sendCallResultWithMessage(message, { status });
} else {
  // response branch: also persist (direction CSMS_TO_CP) for audit
}
```

---

## 6. Downstream (Kabisa New-backend) — Phase 2, optional

The Kabisa sync (`src/citrine/citrineSync.ts`) watches only `Transactions`/`MeterValues`/
`TransactionEvents`. Once `DataTransferData` exists it can:
- **wl vid** → resolve/attach `ChargingSession.vehicleId` (autocharge by vid; the sync already
  pushes `kabisaVehicleId` to Airtable via `FID_SESSION_KABISA_ID_VEHICLE`).
- **chargefairy soc** → seed `startSoc`/live SoC when MeterValues lack a SoC sample.

Phase 2 is a separate ticket — gate on Phase 1 landing + a `vid`→Vehicle mapping decision.

---

## 7. Rollout / testing

1. Model + migration + repository (no behavior change yet).
2. Add parsing + registry + storage, **keep responding Rejected** → verify rows populate, parser
   coverage looks right on real traffic (kacyiru/kanombe/sichey).
3. Flip to status-by-parse. Watch one `wl` station (e.g. k_kacyiru_2) for any charger behavior
   change on `Accepted` (some firmwares ignore it — confirm no regression).
4. Unit tests: malformed `wl` JSON (unclosed quote), base64 payload, missing `data`, placeholder
   `vid`, unknown vendor, unknown messageId.

## 8. Open questions

- Is `QueryCard` (legacy e_kacyiru_1) still live, or dead weight? (last seen Apr 2026)
- `vid` ↔ Vehicle mapping source of truth (RFID registry?) — needed before Phase 2 autocharge.
- Multi-tenant: registry per-tenant or global? (start global.)
