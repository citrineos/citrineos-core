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
   the [admin API](#admin-api), with a token from Core for a role that grants `payment.accounts.put` (in auth mode
   localDev, `POST /dev/token` with `{"roles": ["admin"]}`) or the platform API key: set `PAYMENT_ADMIN_API_KEY` (at
   least 32 characters) in `.env.local` outside the docker stack; the stack's is in `docker.env`.

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

Core decides who may use `/api/admin`. A request's `Authorization` header goes to Core's `GET /permissions/user`, which
says which tenant the caller belongs to and which permissions its roles grant; every route needs the permission below,
for the caller's tenant only. This works in each of Core's auth modes: a jwt-mode token, a localDev token from
`/dev/token`, or, under localBypass, no credentials at all. Answers are kept for 30 seconds per caller, so a role change
takes effect within that. The `payment.*` permissions are granted in Core's role seed
(`apps/ocpp-server/src/assets/roles-seed.json`: all of them to `admin`, all but `payment.accounts.delete` to `user`),
and Core's `roles.externalPermissions` lists them in its permission catalog.

The platform's `PAYMENT_ADMIN_API_KEY`, sent as `Authorization: Bearer <key>`, also works, for every tenant and every
route, without asking Core: for automation.

| Route                                                                           | Permission                 | Does                                                                                                                                       |
| ------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/admin/payment-accounts`                                               | `payment.accounts.get`     | The payment accounts the caller may see                                                                                                    |
| `GET /api/admin/tenants/:tenantId/payment-account`                              | `payment.accounts.get`     | A tenant's account                                                                                                                         |
| `PUT /api/admin/tenants/:tenantId/payment-account`                              | `payment.accounts.put`     | Creates (201) or changes it: `stripeAccountId`, `scanAndChargeEnabled`, `termsUrl`                                                         |
| `DELETE /api/admin/tenants/:tenantId/payment-account`                           | `payment.accounts.delete`  | Stops the tenant taking payments                                                                                                           |
| `GET /api/admin/checkouts?tenantId&status&transactionDatabaseId&beforeId&limit` | `payment.checkouts.get`    | Checkouts, newest first; `status` takes a comma-separated list; `transactionDatabaseId` is Core's transaction id; page with `nextBeforeId` |
| `GET /api/admin/checkouts/:publicId`                                            | `payment.checkouts.get`    | One checkout, with its payment intent                                                                                                      |
| `POST /api/admin/checkouts/:publicId/settle`                                    | `payment.checkouts.settle` | Reconciles it now, as the sweep would, and also retries a failed capture                                                                   |
| `POST /api/admin/checkouts/:publicId/cancel`                                    | `payment.checkouts.cancel` | Releases the hold of a checkout that has not started charging, or whose capture failed                                                     |

A tenant's Stripe account cannot be changed or removed while it has open checkouts: Stripe's webhooks find a
checkout's tenant through it.

### In the operator UI

The operator UI's transaction page links a transaction a driver paid for here to what the driver saw: the receipt once
the payment is captured, else the page that follows the session. Its server looks the checkout up with
`GET /api/admin/checkouts?transactionDatabaseId`, sending the signed-in user's own Core token, so the payment app
answers for the user's tenant and only when the user's roles grant `payment.checkouts.get`; the page does not ask
otherwise. It only asks about transactions with no authorization yet (scan and charge) or one of this app's
`Central` idTokens; another token's transaction can have at most a scan-and-charge checkout cancelled unpaid. Set
these in the operator UI's environment (`apps/operator-ui/.env.local`); without them it shows no link:

| Variable                              | Value                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `PAYMENT_URL`                         | Where the operator UI's server reaches this app; `http://citrineos-payment:9010` in docker   |
| `PAYMENT_PUBLIC_URL`                  | Where browsers reach the driver pages (`PAYMENT_PUBLIC_URL` here); defaults to `PAYMENT_URL` |
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

## Moving from citrineos-payment (Python)

This app replaces [citrineos-payment](https://github.com/citrineos/citrineos-payment); the two do not share pages,
QR codes or checkouts, so an installation moves over once. The Python service kept its tables (`payment_operators`,
`payment_evses` and so on, after its `DB_TABLE_PREFIX`) in Core's database, which this app uses too. It predates
tenants in Core: its EVSEs name the old tenant id (`T01`), and Core's own upgrade moved every station to the default
tenant, so the migration finds each station by its OCPP identity instead.

Before you start: the two must not share a RabbitMQ queue. The Python service consumed
`MESSAGE_BROKER_EVENT_CONSUMER_QUEUE_NAME` (`paymentService` in its example), this app `AMQP_QUEUE` (`payment`); on
one queue they would take turns at the messages and each miss the other's half. Both apps also need the same Stripe
platform: the operators' accounts are connected to the platform of the Python service's `STRIPE_API_KEY`, and this
app can only take payments on them with a key of that platform.

1. **Stop new Python checkouts.** It has no switch for this: block `POST <WEBSERVER_PATH>/checkouts/` (`/api/...`
   by default) at the proxy in front of it, leaving `<WEBSERVER_PATH>/webhooks/stripe` reachable, and set
   `CITRINEOS_SCAN_AND_CHARGE=false` and restart it, so it stops putting payment links on stations' screens. Keep it
   running otherwise, with its Stripe webhook: a driver who already opened a Checkout Session can still pay for up to
   24 hours, and only it starts that session. Then deactivate the scan and charge payment links it created ("Charging
   Session Authorization Amount", under Payment links on each connected account in the Stripe Dashboard): unpaid
   ones stay payable, and once it is gone nothing would start the session.
2. **Dry run.** With this app's database settings (the `DB_*` variables) pointing at Core's database and its
   `STRIPE_API_KEY` set, run `pnpm migrate:python` in `apps/payment` (in the docker stack:
   `docker compose exec citrineos-payment node dist/migration/cli.js …`; `--prefix` if its `DB_TABLE_PREFIX` was not
   `payment_`, `--source <Postgres URL>` if its tables are not in Core's database). It changes nothing and reports:
   - the sessions it took payment for that still hold money: those still charging in Core, which it captures when
     they end, and those held on Stripe with nothing charging, which it will not settle any more (a failed capture,
     or a station that did not report the session's end with the `remoteStartId` it matches on): capture or cancel
     those in the Stripe Dashboard, or Stripe cancels them 7 days after the payment. Without a Stripe key it can only
     list the ones that never ended;
   - each tenant's payment account, from the operator whose EVSEs it holds, and conflicts to decide by hand, and any
     operator account this app's Stripe key cannot reach;
   - the QR code to print for each EVSE, `<PAYMENT_PUBLIC_URL>/checkout/<Core EVSE id>` (`--public-url`);
   - what to fix in Core, as drivers see it there now: EVSEs, connectors or tariffs it does not have or that differ,
     eMI3 ids drivers type on the home page, the address (Core's location of the station, where the Python service
     kept its own copy) and the tenant name drivers now see as the operator;
   - warnings: per-minute prices, which the Python service charged from the session's start to its end and this app
     charges on Core's time spent charging, and EVSE ids of digits only, whose old QR codes would open the Core EVSE
     of that number here.
3. **Add this app's webhook.** Add its Connect endpoint in Stripe (see [Stripe](#stripe-for-local-development)).
   While both endpoints are set, each receives the other's `checkout.session.completed` events. This app acknowledges
   sessions it did not open; the Python service answers 404 to this app's, which Stripe retries for up to 3 days and
   reports as failures of its endpoint, so keep the overlap short.
4. **Apply.** Run it again with `--apply` (and `--scan-and-charge` to turn scan and charge on). It only creates the
   payment accounts it could decide and moves this app's checkout ids past every id the Python service used, so a new
   idToken (`PAYMENT_ID_TOKEN_PREFIX` + id) can never name one of its Authorizations; pass
   `--python-id-token-prefix` if its `OCPP_REMOTESTART_IDTAG_PREFIX` was different. Run it before this app opens any
   checkout. It refuses while a session the Python service took payment for is still charging (exit code 3) unless
   `--ignore-open-checkouts`. Set conflicting accounts with `PUT /api/admin/tenants/:tenantId/payment-account`.
5. **Fix Core** as the report lists.
6. **Reprint the QR codes.** The Python service's codes encode `<its address>/checkout/<eMI3 id>`, which this app
   does not serve: drivers who scan one land on the home page and have to type the EVSE ID.
7. **Retire the Python service** once the report lists no sessions it still has to settle: stop it, remove its Stripe
   webhook endpoint, and delete its RabbitMQ queue, which otherwise keeps collecting every transaction event. Its
   charging and receipt pages (`/charging/<EVSE>/<checkout>`, `/receipt/<EVSE>/<checkout>`) stop working with it. Its
   tables are only read, never changed, and stay as the archive of its checkouts. The Authorizations it created in
   Core (`<prefix><checkout id>`, and random ids for scan and charge, type `Central`) stay `Accepted`; set them to
   `Invalid` if you do not want them to authorize anything again.

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
