<!--
SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

# CitrineOS Payment (`@citrineos/payment`)

Ad-hoc card payments for charging sessions through Stripe Connect. It runs alongside CitrineOS Core and reads tariffs,
locations, EVSEs, connectors and transactions from Core rather than keeping its own copies.

## Running locally

Core (its PostgreSQL, RabbitMQ and HTTP API) must be running and migrated (see the [root README](../../README.md)).

```bash
pnpm --filter "@citrineos/payment..." run build
cd apps/payment
pnpm start
```

`pnpm start` builds this app, the driver pages and the packages they use, runs this app's migrations and starts the
server on port 9010, where it serves the driver pages as well as the API.

It loads `apps/payment/.env.local` (ignored by git), which needs the three secrets: copy `.env.local.example` and fill
it in; see [Stripe for local development](#stripe-for-local-development) for where to get them. Variables already set
in your shell take precedence over the file. Outside docker, `CORE_AUTH_MODE` defaults to `localDev`: the server gets
its Core tokens from Core's `/dev/token`, which a locally run Core offers. Against a Core in another auth mode, set
`CORE_AUTH_MODE=headers` and `CORE_HEADERS` (see [Configuration](#configuration)).

```bash
curl http://localhost:9010/health
# {"status":"healthy"}
```

## Driver pages

`frontend/` is the driver-facing single-page app (`@citrineos/payment-frontend`: React, TypeScript, Vite), in English
and German. `pnpm build` there writes it to `frontend/dist`, which the server serves on the same origin as its API:

| Page                  | Shows                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------- |
| `/`                   | Find a charger by the EVSE ID printed on it (eMI3, with or without `*`) or its QR code. |
| `/checkout/:evseId`   | Where it is, who runs it, its connectors and prices with VAT; pays the hold.            |
| `/charging/:publicId` | The session as it runs, refreshed every 5 s, until it is settled or cancelled.          |
| `/receipt/:publicId`  | The itemised cost of a settled session.                                                 |

A QR code on a charger should encode `<PAYMENT_PUBLIC_URL>/checkout/<EVSE database id>`. When the tenant's payment
account has a `termsUrl`, the driver has to accept it before paying.

To work on the pages with hot reload, run `pnpm dev` in `apps/payment` instead of `pnpm start`: it starts the server
and Vite together. Open the pages on port 3010, where Vite serves them and forwards `/api` to the server; the server
sends drivers back there after paying (`PAYMENT_PUBLIC_URL=http://localhost:3010`).

#### Where the pages are, and what has to point there

The pages call the API with relative paths, so they need no base URL of their own and work wherever they are served.
What does depend on it is everything that links to them:

| Run with                       | Driver pages            | API (Stripe webhooks, Core's callbacks) |
| ------------------------------ | ----------------------- | --------------------------------------- |
| `pnpm start`, the docker stack | `http://localhost:9010` | `http://localhost:9010`                 |
| `pnpm dev`                     | `http://localhost:3010` | `http://localhost:9010`                 |

- `PAYMENT_PUBLIC_URL` (this app): where Stripe sends drivers after paying and where a scan-and-charge QR code points.
  `pnpm dev` sets it to port 3010 itself; behind a proxy or in production, set it to the address drivers use.
- `PAYMENT_PUBLIC_URL` in the operator UI: where its links to receipts point, so port 3010 while you use `pnpm dev`
  (see [In the operator UI](#in-the-operator-ui)).
- QR codes printed on chargers: they encode `<PAYMENT_PUBLIC_URL>/checkout/<EVSE database id>`, so print them for the
  address drivers will use in production, not a development one.
- `stripe listen` and Core's callbacks (`PAYMENT_INTERNAL_URL`) go to the server itself, port 9010 in every case.

### In the docker stack

```bash
cp apps/payment/.env.local.example apps/payment/.env.local   # then fill in your Stripe test keys
pnpm citrine --payment
```

`--payment` adds the `citrineos-payment` service (compose profile `payment`) on port 9010: the payment API and the
driver pages, served together, so `http://localhost:9010/checkout/<EVSE database id>` works once it is up. No image of
it is published yet, so it is always built from local source (`apps/payment/deploy.Dockerfile`, from the repository
root), with or without `--local`; the first build takes a few minutes. It reads
`apps/payment/docker.env`, the stack's settings, then `apps/payment/.env.local` (ignored by git), so the keys and
any override go there. In the stack, Core runs in auth mode localDev and the payment server mints its Core tokens
from Core's `/dev/token` (`CORE_AUTH_MODE=localDev`); the admin API key is `docker.env`'s
`PAYMENT_ADMIN_API_KEY`. Both are for local use only. The image runs this app's migrations on start, after Core's.

## Stripe for local development

The app takes payments through [Stripe Connect](https://docs.stripe.com/connect): checkouts are created on a tenant's
connected account, and Stripe reports a completed payment with a `checkout.session.completed` webhook. Locally, use a
Stripe account in [test mode](https://docs.stripe.com/test-mode); no real money moves.

1. **API key.** In the Stripe Dashboard, copy your platform account's secret test key (`sk_test_…`) from
   [Developers → API keys](https://dashboard.stripe.com/test/apikeys) ([docs](https://docs.stripe.com/keys)). This is
   `STRIPE_API_KEY`.
2. **Webhook secret.** Stripe cannot reach `localhost`, so the [Stripe CLI](https://docs.stripe.com/stripe-cli)
   receives the webhooks and forwards them. Install it (`brew install stripe/stripe-cli/stripe`), sign in with the
   platform account (`stripe login`), then keep this running while you work:

   ```bash
   stripe listen --forward-connect-to localhost:9010/api/webhooks/stripe --events checkout.session.completed
   ```

   It prints `Your webhook signing secret is whsec_…`: that is `STRIPE_CONNECT_WEBHOOK_SECRET`. It stays the same
   across runs for the same machine and account. Use `--forward-connect-to`, not `--forward-to`: this app only accepts
   [events from connected accounts](https://docs.stripe.com/connect/webhooks), and `--forward-to` forwards only the
   platform account's own ([`stripe listen` reference](https://docs.stripe.com/cli/listen)). This works for the docker
   stack too, since compose publishes port 9010.

3. **Callback secret.** `PAYMENT_CALLBACK_SECRET` is not Stripe's: any random string of at least 32 characters, e.g.
   `openssl rand -hex 32`. The docker stack sets one in `docker.env`.
4. **A connected account for the tenant.** In the Dashboard, create a test connected account under
   [Connect → Accounts](https://dashboard.stripe.com/test/connect/accounts/overview)
   ([testing Connect](https://docs.stripe.com/connect/testing)) and register its `acct_…` id for the tenant through
   the [admin API](#admin-api). Outside the docker stack, set `PAYMENT_ADMIN_API_KEY` (at least 32 characters)
   in `.env.local` first; the stack's is in `docker.env`.

   ```bash
   curl -X PUT http://localhost:9010/api/admin/tenants/1/payment-account \
     -H "Authorization: Bearer $PAYMENT_ADMIN_API_KEY" -H 'Content-Type: application/json' \
     -d '{"stripeAccountId": "acct_…"}'
   ```

   Use the connected account's id, not your platform account's own (`stripe accounts retrieve` shows the platform's).
   With the platform's id, Stripe takes the payment on the platform itself: `stripe listen` prints
   `--> checkout.session.completed` without `connect` and forwards nothing, and the driver's page stays on "The payment
   was not completed".

5. **Pay.** Open `http://localhost:9010/checkout/<EVSE database id>` (port 3010 with `pnpm dev`) for an EVSE whose
   connector has a tariff with an authorization amount, and pay with a [test card](https://docs.stripe.com/testing)
   such as `4242 4242 4242 4242` (any future expiry and CVC). `stripe listen` shows
   `--> connect checkout.session.completed` and the app's `<-- [200]` answer, and the checkout moves on to starting
   the session. The card is only authorized at first and captured when the session ends ([placing a hold](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method)).

For a deployed environment, add the endpoint in the Dashboard instead, under
[Developers → Webhooks](https://dashboard.stripe.com/webhooks): URL `<PAYMENT_PUBLIC_URL>/api/webhooks/stripe`,
listening to events on connected accounts, event `checkout.session.completed`. Its signing secret is
`STRIPE_CONNECT_WEBHOOK_SECRET` there.

## Configuration

`APP_ENV` selects the defaults: `docker` uses `src/config/envs/docker.ts`, anything else uses
`src/config/envs/local.ts`. The values are validated against `src/config/types.ts` at startup, and the server refuses
to start without the three secrets.

| Variable                                | Default (local / docker)                                   | Purpose                                                    |
| --------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `PAYMENT_PORT`                          | `9010`                                                     | HTTP port                                                  |
| `PAYMENT_PUBLIC_URL`                    | `http://localhost:9010`                                    | Where drivers and stations reach this app                  |
| `PAYMENT_FRONTEND_DIR`                  | `frontend/dist`                                            | The built driver pages; without them only the API runs     |
| `PAYMENT_INTERNAL_URL`                  | `http://localhost:9010` / `http://citrineos-payment:9010`  | Where Core reaches this app with a station's answer        |
| `PAYMENT_CALLBACK_SECRET`               | _required_, at least 32 characters                         | Signs the callback URLs handed to Core                     |
| `STRIPE_API_KEY`                        | _required_                                                 | The platform's Stripe secret key                           |
| `STRIPE_CONNECT_WEBHOOK_SECRET`         | _required_                                                 | Signing secret of the Connect webhook endpoint             |
| `CORE_URL`                              | `http://localhost:8080` / `http://citrine:8080`            | Core's HTTP API                                            |
| `CORE_HEADERS`                          | `{}`                                                       | JSON headers for requests to Core, e.g. `Authorization`    |
| `CORE_TENANT_HEADERS`                   | `{}`                                                       | JSON headers per tenant id, used instead of `CORE_HEADERS` |
| `CORE_AUTH_MODE`                        | `localDev` / `headers` (the stack sets `localDev`)         | `headers`, or `localDev` to mint tokens from Core          |
| `CORE_LOCAL_DEV_ROLES`                  | `admin`                                                    | Comma-separated roles asked for in localDev tokens         |
| `AMQP_URL`                              | `amqp://guest:guest@localhost:5672` / `…@amqp-broker:5672` | Core's RabbitMQ                                            |
| `AMQP_EXCHANGE`                         | `citrineos`                                                | The exchange Core publishes to                             |
| `AMQP_QUEUE`                            | `payment`                                                  | This app's durable queue                                   |
| `PAYMENT_ID_TOKEN_PREFIX`               | `PAY_`                                                     | Prefix of the idTokens issued for remote starts            |
| `PAYMENT_ADMIN_API_KEY`                 | none; at least 32 characters                               | Platform-wide access to `/api/admin`                       |
| `PAYMENT_ADMIN_JWT_JWKS_URI`            | none                                                       | Enables tenant admins' JWTs on `/api/admin`                |
| `PAYMENT_ADMIN_JWT_ISSUER`              | _required with the JWKS URI_                               | The tokens' issuer                                         |
| `PAYMENT_ADMIN_JWT_AUDIENCE`            | none (any)                                                 | The tokens' audience                                       |
| `PAYMENT_ADMIN_JWT_ROLES_CLAIM`         | `roles`                                                    | Claim, or dotted path, holding the roles                   |
| `PAYMENT_ADMIN_JWT_TENANT_CLAIM`        | `tenant_id`                                                | Claim, or dotted path, holding the tenant id               |
| `PAYMENT_ADMIN_JWT_ROLE`                | `admin`                                                    | The role that grants admin access to the token's tenant    |
| `PAYMENT_RATE_LIMIT_PER_MINUTE`         | `20`                                                       | Per client address on lookup, checkout and pay; `0` is off |
| `PAYMENT_TRUST_PROXY`                   | `false`                                                    | `true` behind a proxy: client address from X-Forwarded-For |
| `PAYMENT_RECONCILE_INTERVAL_SECONDS`    | `60`                                                       | How often the sweep runs; `0` turns it off                 |
| `PAYMENT_RECONCILE_STALE_AFTER_SECONDS` | `600`                                                      | How long a checkout sits still before the sweep acts       |
| `DB_HOST`                               | `localhost` / `ocpp-db`                                    | PostgreSQL host                                            |
| `DB_PORT`, `DB_NAME`                    | `5432`, `citrine`                                          | PostgreSQL port and database                               |
| `DB_USER`, `DB_PASS`                    | `citrine`, `citrine`                                       | PostgreSQL credentials                                     |
| `LOG_LEVEL`                             | `2`                                                        | tslog minimum level (0 – 6)                                |

Core scopes an API token to one tenant. A single `CORE_HEADERS` token therefore only starts sessions for that tenant;
give every other tenant its own entry in `CORE_TENANT_HEADERS`. A Core in auth mode localDev mints tokens itself, so
`CORE_AUTH_MODE=localDev` needs neither; Core refuses localDev in production.

Run one instance. Every checkout step is a conditional status change, so concurrent instances cannot double-capture,
but they would share the RabbitMQ queue and could handle a station's transaction end before its start.

## Admin API

Every `/api/admin` route needs `Authorization: Bearer <credential>`: the platform's `PAYMENT_ADMIN_API_KEY`, for
every tenant, or a JWT from the issuer Core trusts in auth mode jwt, carrying the admin role, for the tenant it
names. Core's localDev tokens are signed with a key that never leaves Core, so local development uses the API key.

| Route                                                                           | Does                                                                                                                                       |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/admin/payment-accounts`                                               | The payment accounts the caller may see                                                                                                    |
| `GET /api/admin/tenants/:tenantId/payment-account`                              | A tenant's account                                                                                                                         |
| `PUT /api/admin/tenants/:tenantId/payment-account`                              | Creates (201) or changes it: `stripeAccountId`, `scanAndChargeEnabled`, `termsUrl`                                                         |
| `DELETE /api/admin/tenants/:tenantId/payment-account`                           | Stops the tenant taking payments                                                                                                           |
| `GET /api/admin/checkouts?tenantId&status&transactionDatabaseId&beforeId&limit` | Checkouts, newest first; `status` takes a comma-separated list; `transactionDatabaseId` is Core's transaction id; page with `nextBeforeId` |
| `GET /api/admin/checkouts/:publicId`                                            | One checkout, with its payment intent                                                                                                      |
| `POST /api/admin/checkouts/:publicId/settle`                                    | Reconciles it now, as the sweep would, and also retries a failed capture                                                                   |
| `POST /api/admin/checkouts/:publicId/cancel`                                    | Releases the hold of a checkout that has not started charging, or whose capture failed                                                     |

A tenant's Stripe account cannot be changed or removed while it has open checkouts: Stripe's webhooks find a
checkout's tenant through it.

### In the operator UI

The operator UI's transaction page links a transaction a driver paid for here to what the driver saw: the receipt once
the payment is captured, else the page that follows the session. Its server looks the checkout up with
`GET /api/admin/checkouts?tenantId&transactionDatabaseId`, using the API key and always naming the signed-in user's
tenant. It only asks about transactions with no authorization yet (scan and charge) or one of this app's
`Central` idTokens; another token's transaction can have at most a scan-and-charge checkout cancelled unpaid. Set
these in the operator UI's environment (`apps/operator-ui/.env.local`); without them it shows no link:

| Variable                              | Value                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `PAYMENT_URL`                         | Where the operator UI's server reaches this app; `http://citrineos-payment:9010` in docker   |
| `PAYMENT_PUBLIC_URL`                  | Where browsers reach the driver pages (`PAYMENT_PUBLIC_URL` here); defaults to `PAYMENT_URL` |
| `PAYMENT_ADMIN_API_KEY`               | This app's `PAYMENT_ADMIN_API_KEY`                                                           |
| `NEXT_PUBLIC_PAYMENT_ID_TOKEN_PREFIX` | This app's `PAYMENT_ID_TOKEN_PREFIX`, if not the default `PAY_`                              |

## Reconciliation

Every `PAYMENT_RECONCILE_INTERVAL_SECONDS` the server looks for checkouts that have not changed for
`PAYMENT_RECONCILE_STALE_AFTER_SECONDS` and moves them on from Core's data:

- paid, but no session linked: linked to the transaction the station did start (and settled if it is over), or the
  hold is released when there is none;
- charging, or interrupted while capturing: captured once Core has the ended transaction's kWh and charging time,
  with the same Stripe idempotency key as the first attempt;
- unpaid: cancelled when the EV it was plugged in for has left, or once Stripe's Checkout Session has expired.

A failed capture is left for an operator (`POST …/settle` retries it, `POST …/cancel` releases the hold).

## How a session is paid for

1. `GET /api/evses/lookup?q=` finds an EVSE by what a driver types: its eMI3 id or database id.
   `GET /api/evses/:evseId` shows an EVSE (by its database id, which is what the sticker's QR code encodes), its
   connectors and their tariffs. The EVSE decides the tenant.
2. `POST /api/checkouts` with `{ "evseId", "connectorId"? }` creates a checkout and a Stripe Checkout Session for the
   tariff's `authorizationAmount`, on the tenant's connected account, with manual capture. It returns the session URL.
3. Stripe calls `POST /api/webhooks/stripe` with `checkout.session.completed`. The event's connected account must
   belong to the checkout's tenant. The app creates an Authorization in Core for the idToken `PAY_<checkout id>`
   and asks Core to start the session: `RemoteStartTransaction` for OCPP 1.6, `RequestStartTransaction` for 2.x,
   with the hold as the transaction's `maxCost` on 2.1. Core reports the station's answer to
   `POST /api/callbacks/remote-start/:publicId`, signed with `PAYMENT_CALLBACK_SECRET`; a rejection releases the hold.
4. The app follows `StartTransaction`, `StopTransaction` and `TransactionEvent` on its own queue bound to Core's
   exchange. When the station starts a transaction with the issued idToken, the checkout is linked to Core's
   transaction. When the transaction ends, the session is priced from Core's final kWh and charging time and the
   lesser of that and the hold is captured; a session that cost nothing has its hold released.
5. `GET /api/checkouts/:publicId` reports the checkout's status and the session's cost so far.

## Scan and charge

For OCPP 2.0.1 and 2.1 stations whose tenant has `scanAndChargeEnabled` set on its payment account. The station has
to start a transaction when the EV is plugged in (`TxStartPoint` includes `EVConnected`), and be able to show an image
from a URI.

1. A `TransactionEvent` `Started` without an idToken, triggered by `CablePluggedIn`, `EVDetected` or
   `SignedDataReceived`, opens a checkout for that transaction on the connector Core recorded for it (or the EVSE's only
   connector), priced with the connector's tariff.
2. The app asks Core to `SetDisplayMessage` on the station for the length of the transaction, in front of anything
   else: a URI, `GET /api/checkouts/:publicId/qr.png`, from which the station fetches a QR code. The message id is the
   checkout's id, so two checkouts never replace each other's message; a message an operator set with the same id
   would be replaced.
3. The QR code opens `GET /api/checkouts/:publicId/pay`, which redirects to a Stripe Checkout Session for the hold
   (the same one on every scan) while the EV is plugged in and the hold unpaid, and to `/charging/:publicId` otherwise.
4. Once paid, the session starts as in the web-portal flow, with `RequestStartTransaction` for the plugged-in EVSE and
   the idToken `PAY_<checkout id>`, and the QR code is cleared. A payment made after the EV left is released.
5. The checkout is cancelled, and its QR code cleared, when another idToken authorises the transaction (a card at the
   reader, say), and cancelled when the transaction ends before the station took the payment.

Every step that changes a checkout moves it between named statuses only from the ones it may leave, so a repeated
webhook, callback or bus message is acted on once.

## Data

This app owns two tables in Core's database and reads everything else (tenants, tariffs, EVSEs, connectors,
transactions) from Core.

| Table             | Holds                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `PaymentAccounts` | One Stripe Connect account per tenant, whether scan-and-charge is enabled, and its terms URL. |
| `Checkouts`       | One payment: the Stripe account and tariff it was priced against, and its progress.           |

A checkout keeps a copy of the tariff it was created with (`tariffSnapshot`) and of the Stripe account it was
charged on, so a later change to either does not change what was authorised or where it is captured.
`transactionDatabaseId` has no foreign key: Core partitions `Transactions` and drops old partitions, and a checkout
has to outlive them.

## Pricing

`src/pricing` prices a session from a tariff and its usage (kWh and seconds spent charging) with Core's
`baseCalculateTotalCost`, the same calculation Core uses for a transaction's `totalCost`. Amounts are returned in the
currency's minor units. Each component (energy, time, session fee) is rounded down on its own and VAT is applied per
component, so totals can be a cent or two below a total rounded once at the end. The tariff's `paymentFee` is
reported as `paymentCosts` and never charged.

## Migrations

Migrations live in `db/migrations` and run against Core's database with `pnpm db:migrate`, through `.sequelizerc` and
`src/config/sequelize-bridge.config.ts`. Core's migrations (`apps/ocpp-server`) must run first, since the payment
tables reference Core tables. Core's `require-migration` workflow only watches the DAL, so
`test/migrations.test.ts` checks that every model column exists in the migrated schema with the same nullability.

## Tests

```bash
pnpm exec vitest run --project payment --project payment-frontend
```

The repository and migration suites start PostGIS with [testcontainers](https://testcontainers.com/) and need a
running Docker daemon.
