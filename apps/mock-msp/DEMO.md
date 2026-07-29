# Mock eMSP dashboard — walkthrough for Mason

**Runtime: ~18 min.** Left column = what to do, right = what to say.

Representative health (preregistered, freshly restarted — your first row will be #1):

```json
{"status":"up","party":"US/TST","role":"EMSP","registration":{"status":"registered"},"scenario":"preregistered","exchanges":0,"findings":0,"faults":0,"authorize":"ALLOWED"}
```

`/_mock/faults` = `[]` · `/_mock/exchanges` = `[]` · `GET /` = 200.

Real CitrineOS is running in Docker (7 containers, OCPI on :8085, Hasura on :8090). **Everything in this demo is real traffic.** There is no "I'm playing Citrine's role" disclaimer — it would be false. This build answers Mason's question directly: **it does both directions** — we call Citrine, *and* we can make Citrine call us — with a **Provoke** panel, a live **coverage matrix**, and a **dynamic fault builder** in place of the old preset buttons.

---

## PRE-FLIGHT (T-minus 3 minutes)

Run top to bottom. Any FAIL → jump to the [Panic Button](#panic-button).

**Step 1 — Citrine containers (OCPI + DB + Hasura)**
```bash
docker ps --format "{{.Names}}\t{{.Status}}" | grep -E "citrineos-ocpi|ocpp-db|hasura"
```
Expect all `Up`. FAIL → `docker start citrineos-core-citrineos-ocpi-1`. (Hasura powers the Provoke buttons — if it's down, Provoke returns a 502 but nothing else breaks.)

**Step 2 — Health, faults, recorder in one shot**
```bash
curl -s localhost:8083/_mock/health; echo; curl -s localhost:8083/_mock/faults
```
PASS = `"registration":{"status":"registered"...}` **and** `"scenario":"preregistered"` **and** `exchanges 0 / findings 0 / faults 0` **and** `[]` for faults.

FAIL on any of it → **Tier 2 restart** (below). Do *not* reach for `_mock/reset` to tidy up — it blanks the scenario badge you're about to point at in Beat 2. A fresh `demo-up.sh` is already 0/0/0 **and** keeps the badge. You cannot have both a reset and the badge.

> A stale armed fault silently poisons the money shot. That is why faults is checked before anything else.

**Step 3 — Dashboard**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8083/
```
Expect `200`. Open `http://localhost:8083/` with **Ctrl+Shift+R**, confirm **live** is ticked, window **≥900px**, zoom ~110%. Share the **window**, not the screen — a notification over the money shot is its own accident.

**Step 4 — No terminal needed**

The old CDR/demo-trigger terminal step is gone — **the Provoke buttons make Citrine push, in-browser.** If you *want* the terminal fallback staged anyway, see [Fallbacks](#fallbacks) at the end. Otherwise skip straight to Beat 1.

### ⛔ NEVER CLICK LIST (memorise — all in the left rail)

| ⛔ | Why |
|---|---|
| **Register** | Hard 502, `generate-credentials-token-a did not return a token`. Red toast in front of Mason. |
| **Re-register** | Green 200 that does nothing and never calls Citrine. A lie on screen. |
| **Unregister** | The genuinely dangerous one. Blanks our token → everything after 401s. |
| **Reset recorder + state** | Won't break registration (it *restores* it), but wipes your visual story **and blanks the scenario badge**. |
| **Fault builder with Module = _any_ + Direction = _any_** | The dynamic equivalent of the old "Delay 2s all." A `delay`/`abort` armed against *everything* hits every click. Always scope the module before arming. |
| **Control secret** input | Leave empty. Point at it, don't type in it. |

Everything else — the **Provoke** buttons, **Pull all**, the **Send command** control, and any *scoped* fault — is safe to press live.

---

## BEAT 1 — What this is and why it exists · 0:00–0:45

**[Screen on the dashboard. Don't touch anything. Just talk.]**

> Quick context, because three acronyms land in the first ten seconds.
>
> **OCPI** is the standard REST API two charging companies use to talk to each other — chargers, prices, sessions, bills.
>
> A **CPO** owns the physical chargers. That's CitrineOS, running in Docker right here. Identity `US/S44`.
>
> An **eMSP** owns the *driver* — the app, the RFID card, the billing relationship. That's this thing. A fake one. Identity `US/TST`, "TestMobilitySolutions".
>
> So: I built a fake driver-side company and pointed it at the real CitrineOS. Everything on this screen is real traffic to a real server on port 8085. Nothing is stubbed.
>
> It does four jobs. It **watches** every message. It **acts** like a perfectly well-behaved partner. It can **make Citrine talk back on command** — that's the "both directions" question you asked, and I built the answer into a button. And when I tell it to, it **misbehaves on purpose**. That's the whole tool.

---

## BEAT 2 — The header strip · 0:45–2:00

**[Point at `◆ mock-msp`, then walk right.]**

> Top-left, `US/TST · EMSP` — who I am on the wire. Country US, party ID TST, role eMSP.
>
> Next to it, green: **`registered`**.

**[Point at the green badge. Pause — the rest depends on this concept.]**

> Registration in OCPI is a one-time handshake: I hand you my API token and my endpoint list, you hand me yours, and from then on we both know how to call each other and how to prove it's us. Business cards, before anyone will take your call.
>
> Green means that already happened. Citrine has our token, we have Citrine's. That's why I can start clicking immediately instead of spending five minutes on ceremony.
>
> Three states only: green `registered`, amber `unregistered`, red `server down`.

**[Point at `scenario: preregistered`.]**

> This says which **scenario file** is loaded. A scenario is a checked-in JSON file that's the starting state, the fault config, and the test assertions, all in one. `preregistered.json` says "pretend we swapped business cards last month, skip to the interesting part."
>
> I'll come back to why that file matters at the end. It's the best idea in here.

**[Point at `updated HH:MM:SS`, then `live`, then `↻`.]**

> Timestamp on the right — be precise about what that is: it's my *browser's* clock, redrawn every poll. Not the server's time. It only proves the page is alive and still talking.
>
> `live` is on. Every two seconds it fires four reads: health, the wire trace, findings, armed faults. Uncheck it and the page freezes exactly as-is — nothing else changes, it just stops asking. `↻` is one poll right now, and works even with `live` off.

---

## BEAT 3 — The five cards · 2:00–3:15

**[Point at each in turn, left to right.]**

> Five numbers, all from that same two-second health poll.
>
> **EXCHANGES** — complete HTTP conversations recorded. Zero; we haven't done anything. Never coloured, just a count.
>
> **FINDINGS** — this one I need to explain properly, because the number will surprise you in three minutes.

**[Tap the FINDINGS card. Slow down.]**

> A **finding** is one accusation: *this one response didn't match the contract.* One bad response, one finding.
>
> The individual broken fields inside it are **issues**, and there can be any number.
>
> So in a minute we make one call, get one response, and this card says **1** — while the drawer underneath holds **seventeen** separate broken fields. One failed inspection, seventeen violations on the report. The card counts inspections.
>
> Red when non-zero. Never green, never amber. Zero or red.
>
> **FAULTS ARMED** — how many "misbehave on purpose" rules are loaded. Zero. Amber when non-zero. That's your seatbelt light — glance at it before every click.
>
> **REGISTRATION** — same as the badge up top, said twice.
>
> **AUTHORIZE** — `ALLOWED`. When a driver taps a card at one of Citrine's chargers, Citrine calls *me* asking "can this person charge?" This is my standing answer. A scenario file flips it to `BLOCKED` for one specific card — that's how you test declines without owning a declined card.

---

## BEAT 4 — The wire trace, before there's anything in it · 3:15–4:15

**[Point at the empty table and "No exchanges yet".]**

> Middle of the screen: the wire trace. Empty deliberately — I restarted it clean for you.
>
> Eleven columns. Let me name them while it's empty, so when rows land you already know what you're looking at.
>
> **`#`** — sequence, what happened before what. **`time`** — local, to the millisecond.
>
> **`dir`** — direction, and this is the one to internalise: **`C→M` green means Citrine called us**. **`M→C` blue means we called Citrine.** Green inbound, blue outbound. Keep that in your head — the whole "both directions" story is just which colour lands.
>
> **`module`** — locations, tokens, cdrs, sessions. **`operation`** — the specific thing, like `pull.locations`. **`method`** and **`path`** — raw HTTP.
>
> Then the three that matter. **`http`** — green under 300, amber 300s/400s, red 500+.
>
> **`ocpi`** — here's the trick that makes OCPI its own animal. OCPI puts its *real* status inside the JSON body, separate from the HTTP status. `1000` is genuinely fine. 3000+ is a server error. So you can get **HTTP 200 and OCPI 3001 at the same time** — the transport says "great!" and the body says "I'm broken." Green for 1000, red for 3000+, amber between.
>
> **`valid`** — this column is the actual product. Green tick, red `✗ invalid`, or a dash. And the dash matters: **a dash means no schema was applied. It does not mean it passed.** I say that out loud every time, because "no news is good news" is how people ship broken.
>
> **`flags`** — error and warning counts, plus a red pill if *I* broke it on purpose.

---

## BEAT 5 — "Push a token": the Actor · 4:15–5:15

**[Left rail, "Actor · talk to Citrine". Click **▶ Push a token (default RFID)**.]**

> Let's put a clean row on the board first, so the mess later means something.
>
> This is the **Actor** — the half that behaves like a good citizen. It just minted a fake RFID card, `MOCK-` and some hex, and did a real `PUT` into Citrine. "Here's one of my drivers, remember them, they might show up at one of your chargers."

**[Green toast. Row #1 lands within 2s. Point along it.]**

> Row **#1**. **`M→C`** blue — we called them. Module `tokens`. `PUT`. **http 200 green. ocpi 1000 green. valid green tick.** Flags empty.
>
> That's what "everything is fine" looks like. Remember the shape. Green, green, green.
>
> And the key point: by default this thing is a **spec-perfect partner**. It doesn't cut corners. So anything red from here on is not me being sloppy — unless I explicitly armed it, and when I do, it gets stamped on the row.

> *(Aside, if asked about **Send command** just below it: it now ships a schema-valid default payload, so `START_SESSION` on empty `{}` sends a well-formed command Citrine actually parses — you get a real sync `REJECTED` because there's no live station, not a 400. That's the honest local ceiling; the async result needs a real charger.)*

---

## BEAT 6 — THE MONEY SHOT · 5:15–9:00

**[Click **⬇ Pull locations from Citrine**. Let the toast land. Say nothing for two seconds.]**

> Now the other direction. A real `GET` to `localhost:8085/ocpi/2.2.1/locations` — "show me your chargers." And I validate whatever comes back.

**[Row #2 lands. Point across it slowly, one cell at a time.]**

> Row two. `M→C`. `locations`. `pull.locations`. `GET`.
>
> **http: 200. Green.**
>
> **ocpi: 1000. Green.** Citrine is telling me, at both layers, "all good, here are your locations."
>
> **valid: `✗ invalid`. Red.**

**[Pause. Let it sit.]**

> Two greens and a red on one line. Citrine says it's fine. The schema says the body isn't spec.
>
> That gap is the entire reason this tool exists.

**[Point at FINDINGS — now `1`, red.]**

> One finding. One accusation about one response. Now watch the number underneath.

**[Click row #2 to expand.]**

> Meta line first. `req-id`, `corr-id` — tracing IDs, so this exchange is findable in Citrine's logs too. **`from US/TST → to US/S44`** — pulled out of the OCPI routing headers. Real proof this was a properly routed 2.2.1 call between two parties, not curl in a trench coat. **`token ✓`** — we authenticated.
>
> `flow: —` just means this call isn't part of an async chain. Some are.

**[Point at the left pane.]**

> **REQUEST** shows `""`. Correct, not a bug — it's a GET. No body to show.

**[Point at right pane. Scroll to `data[0]`.]**

> **RESPONSE**. Seven locations. `Test Charging Hub`, `123 Electric Avenue`, San Francisco. Real data out of Citrine's database.
>
> Now look at `coordinates`.

**[Point directly at the numbers.]**

> `"latitude": "37.7749"`. `"longitude": "-122.4194"`.
>
> Four decimal places. OCPI 2.2.1 requires **five to seven**. On a mandatory field.

**[Scroll down to FINDINGS in the drawer.]**

> The finding: *"Citrine response to pull.locations failed the ocpi-base schema."* One accusation. That's why the card says 1.
>
> And here are the seventeen receipts.

**[Point down the issue list.]**

> `data.0.coordinates.latitude — Invalid string: must match pattern /-?[0-9]{1,2}\.[0-9]{5,7}/`
> `data.0.coordinates.longitude — must match /-?[0-9]{1,3}\.[0-9]{5,7}/` — same defect, and note longitude allows three leading digits, because longitude runs to 180.
>
> Seven locations, latitude and longitude each — fourteen.
>
> Then `data.0.evses.0.coordinates.latitude` and `.longitude` — the same defect nested one level deeper, inside the charger itself. Sixteen.
>
> And the seventeenth: `data.0.evses.0.physical_reference — Too big: expected string to have <=16 characters`. It's `EVSE-001-PHYSICAL`. Seventeen characters.
>
> Sixteen plus one. That's your 1-versus-17. One finding. Seventeen issues.

> *(Honesty on the count: the "17" is a **fresh Citrine with 7 locations**. Two of the issues scale with the number of locations, so if this stack has had a few Provoke-adds run against it, the count climbs. The *shape* — one finding, N issues, coordinates on every location — is the point, not the exact integer.)*

**[Turn to Mason. Honesty beat — deliver it exactly.]**

> Let me be straight about how bad this actually is, because it's easy to oversell.
>
> On the coordinates: it's a **real, reproducible spec violation, on a mandatory field, hitting a hundred percent of locations, and the nested copy too**. It's also **one line to fix** — the value is *correct*, `37.7749` is the right latitude. It's a formatting problem. Four decimals instead of five. A lenient partner would shrug and take it.
>
> So I don't call it a blocker. I call it **high severity, one-line fix — and it blocks certification and any partner who validates strictly.** That's the defensible line, and the one I'd put in the ticket.
>
> And on `physical_reference` — careful. That 17-character string is **seed data**, not something Citrine's code generated. What it proves isn't "Citrine has a bug there." It proves **Citrine serves its own stored data without validating its own output.** Bad data walks straight onto the wire. Different, quieter problem.

---

## BEAT 6b — The second bug (the stronger card) · 9:00–9:45

**[Still in the Actor section. Click **⬇ Pull CDRs from Citrine**.]**

> One more pull, and honestly this is my better technical card.
>
> CDRs — charge detail records, the bills. Same server, same auth, same envelope rules.

**[Row #3 lands: `200 / — / ✗ invalid`, 2 issues. Expand it.]**

> Look at the response body. Literally `{"data": []}`.
>
> That's it. **No `status_code`. No `timestamp`.** Both mandatory in the OCPI 2.2.1 envelope. Two issues:
>
> `status_code — Invalid option: expected one of 1000|2000|2001|...`
> `timestamp — Invalid input: expected date`
>
> And note the `ocpi` column is a **dash**, not a number — because there's no status code in there to render.
>
> Now — `/sessions` and `/tariffs` on that **same server** return a textbook `{"status_code":1000,"timestamp":"...","data":[],"link":""}`. So Citrine is **inconsistent with itself.**
>
> This one isn't a formatting nit, it's an **interop break**. A client doing `if (res.status_code === 1000)` gets `undefined` and reads a successful empty list as a failure.
>
> Honest caveat: I've only observed this on the **empty-list path**. I haven't seeded a CDR to test the populated path. That's a known limit of the analysis, not a gap in it.

---

## BEAT 7 — Provoke: the OTHER direction, one click · 9:45–11:30

**[Point at the "Provoke · make Citrine push" section in the left rail. This is the new star — the direct answer to Mason's question.]**

> Here's the part you actually asked for. So far *I've* been calling Citrine — blue rows, `M→C`. You asked: can I make it go the other way? Can I see what **Citrine sends**, not just what I send?
>
> Yes. One button.

**[Click **Make Citrine push a new location**. Let the toast land.]**

> I did not just call Citrine's OCPI API. I reached around the side and wrote a row straight into **Citrine's own database**, through its Hasura GraphQL on port 8090. A new charging location.
>
> Citrine notices its own data changed, and — entirely on its own — decides to **broadcast that new location to every roaming partner it's registered with.** One of those partners is me. So in about a second, Citrine is going to call *me*, unprompted.

**[Row #4 lands within ~1–3s. `C→M` green. Point at the direction cell first.]**

> There it is. **`C→M` green** — Citrine calling us. `locations`. `PUT`. This is the inbound direction, live, with no charging session and no terminal. That's the answer: **both directions, and I can drive either from this screen.**

**[Expand row #4. Point at coordinates in the request body.]**

> And look — same coordinates bug, now from the *inbound* side. Citrine *volunteered* this location, we didn't ask for it, and it *still* ships `"37.7749"` — four decimals. `valid ✗`, coordinates finding. So the defect isn't an artefact of how I pull; it's in how Citrine emits, in both directions.

**[Click **Make Citrine update a location**. Row #5 lands: `C→M`, `PATCH`, `valid ✓`.]**

> And the clean counterpart. This one bumps an existing location's name and timestamp — a `PATCH`, carrying only the changed fields. No coordinates in the body, so nothing to fail. `C→M` green, `PATCH`, **valid green tick.** Proof the inbound path is spec-clean when the data is — the mock isn't just painting everything red.
>
> Mechanism, said plainly so nobody thinks it's smoke: the button does a Hasura write; Citrine's database trigger fires; Citrine's OCPI broadcaster makes a genuine HTTP call to me. The write is a *harness* action — it edits Citrine's data — so it is deliberately **not** recorded as one of our OCPI exchanges. Only Citrine's resulting call is. (Small honest note: "add" leaves a real location row in Citrine's DB each time — harmless, but it's why the pull count creeps.)

---

## BEAT 8 — Coverage: "cover it all", at a glance · 11:30–12:45

**[Point at the coverage matrix — module rows × inbound/outbound columns.]**

> You said "full coverage with Citrine." So here's the scoreboard. Every OCPI module down the side, the two directions across the top. Green = we exercised it and the last one was valid. Red = exercised and invalid. Grey = never touched.
>
> Right now `locations` is lit on both columns — outbound red from the pull, inbound red from the Provoke, both carrying the coordinates bug. `cdrs` outbound is red — the envelope bug. `tokens` outbound is green — our clean push.

**[Click **Pull all**.]**

> `Pull all` fans out to locations, sessions, cdrs and tariffs in one go, so the whole Citrine-*sender* side lights up at once.

**[Grid updates: sessions/tariffs green, cdrs red, locations red.]**

> Now `sessions` and `tariffs` go green — proper envelopes — and `cdrs` stays red next to them. That red-among-greens *is* the interop story, drawn as a picture: same server, one module out of step.

**[Point at the greyed / "n/a locally" cells.]**

> And here's the honesty I care about most. These cells are marked **`n/a locally`**, not faked green. Real-time **token authorize** — Citrine only calls me there when a driver physically taps a card at a real charger. The **async command result** — Citrine only posts that back for a real station. I can't provoke either from a laptop, so I refuse to colour them. The easy ninety percent is green-or-red on evidence; the honest ten percent is *labelled*, not invented. A coverage grid that lies is worse than none.

---

## BEAT 9 — The Adversary: the dynamic fault builder · 12:45–14:45

**[Point at "Adversary · inject fault". Don't touch yet.]**

> Fourth job. So far Citrine broke itself. Now I break things on purpose — and this used to be six hard-coded buttons. You didn't like that, and you were right. It's a **builder** now.

**[Point at the three dropdowns.]**

> Three dropdowns. **Module** — who does this hit. **Direction** — inbound, outbound, or any. **Fault kind** — and this is the whole grammar the backend already supports: `delay`, `abort`, `unauthorized`, `httpStatus`, `ocpiStatus`, `malformBody`, `dropHeaders`, `oversizeToken`. Pick a kind and only *its* parameters appear — `ocpiStatus` asks for a code, `delay` asks for milliseconds, `dropHeaders` asks which headers.
>
> The quick-fill chips just pre-load the builder for the common cases — they **don't arm anything**, so I can talk over them safely.

**[Build it live: Module `locations`, Direction `inbound`, Fault kind `ocpiStatus`, code `3001`. Then click **Arm**.]**

> Let's compose the evil one. When Citrine pushes me a **location**, respond `3001` — server error — inside a perfectly well-formed HTTP 200.

**[Green toast. FAULTS ARMED → 1, amber. The rule appears in the armed list with an `✕`.]**

> Armed. One rule, listed underneath with an `✕` to disarm. My seatbelt light is on.

**[Now fire it: click **Make Citrine push a new location** again.]**

> And I trigger it the way we just learned — make Citrine push a location. The fault sits on the *inbound* path, so it mutates **my reply** to Citrine.

**[Row lands: `C→M` green, blood-tinted, red `fault:ocpiStatus` pill. `http 200 / ocpi 3001`.]**

> **HTTP 200. OCPI 3001.** The two layers disagreeing, on purpose this time — exactly the failure mode that gets past everybody: the HTTP client sees 200 and celebrates while the body is screaming. That's why `ocpi` is its own column and not an afterthought.
>
> And the row is tinted red with a `fault:ocpiStatus` pill carrying the rule ID. That's deliberate — **when *I* cause the failure, the receipt says so**, so nobody wastes an hour blaming the mock for a wound I inflicted.

**[Click **Clear all**.]**

> `Clear all` disarms everything. Back to zero, back to being a well-behaved partner.

> *(Honest caveat if asked: status-flavoured faults — `ocpiStatus`, `httpStatus`, `malformBody` — only actually bite on **inbound**, where the mock builds the response. On an outbound **pull** the mock is the *client*; it can't rewrite Citrine's status, so those would tag the row `fault` without changing the bytes. `delay` and `abort` work either way. That's why I fired this one via Provoke, not a pull.)*

---

## BEAT 10 — The filters · 14:45–15:45

**[Point at the "Wire trace" toolbar.]**

> Three filters, all client-side, all instant — no refetch.

**[Open the direction dropdown, pick `Mock → Citrine`, watch the count, set back to `all directions`.]**

> Direction. `Citrine → Mock`, `Mock → Citrine`, or everything. Useful the second the trace gets long — and it maps exactly onto that green/blue distinction.

**[Type `loc` in the text box.]**

> Text filter — module, operation, path, method. Type `loc` and I'm down to locations traffic. Note the count on the right: **filtered / total**.

**[Clear it. Tick **problems only**.]**

> The one I use most. `problems only`: keep the row if I faulted it, or it has an error-level finding, or it failed validation.
>
> The locations rows survive. The CDRs row survives. The clean token push and the clean `PATCH` disappear. One-click "just show me what's broken."
>
> One honest caveat: this filter is **error-only. Warnings don't survive it.** A `pull.tokens` 404 raises a *warn* and silently hides under this filter. Worth knowing before you trust an empty screen.

**[Untick it.]**

---

## BEAT 11 — Registration + Session panels (the do-not-touch rail) · 15:45–16:30

**[Point at the top of the left rail — "Registration handshake".]**

> Two bits of UI I haven't touched, and deliberately won't.
>
> Top of the rail: **Register / Re-register / Unregister** — the business-card ceremony, on demand. ⛔ In *this* setup they're off-limits: our two sides were pre-credentialed by a database seed, so Register comes back 502 — Citrine correctly says "you already have credentials token A." There's nothing to register. That my error handling surfaces that as a 502 rather than "already registered" is honestly a bug in my code, and it's on the list.
>
> **Re-register** is worse in a quieter way — it returns a green 200 and never calls Citrine at all. Green toast means nothing there.
>
> **Unregister** is the only truly dangerous button — it blanks our token and everything after it 401s.

**[Point at the "Session" section at the bottom.]**

> Bottom: **Reset**, which wipes the trace and starts clean — great between runs, ⛔ terrible mid-demo, which is why I'm pointing and not touching.
>
> And **Control secret**. Set an env var and every one of these control buttons needs that header. It's not set here, so the box is inert. It's there for the day this runs somewhere shared.

---

## BEAT 12 — Why you can trust the verdict · 16:30–18:00

**[Turn away from the screen. This is the close.]**

> Last thing, and it's the argument the whole demo rests on.
>
> The normal way a tool like this dies is **schema drift**. I hand-copy the spec into my mock, I typo one regex, and now my tool reports a bug that doesn't exist — or misses one that does. Somebody wastes a day. Everyone quietly stops trusting it. Tool's dead in a month.
>
> So I never wrote a schema. Not one.
>
> That locations response is validated by **`OcpiResponseSchema(LocationDTOSchema)` — imported straight out of `@citrineos/ocpi-base`.** Citrine's own schema object. Same package, same monorepo link, same Zod instance, same version. The exact object Citrine itself parses with.
>
> Which means when those seventeen issues show up, there are only two possibilities. **Either Citrine's output is wrong, or Citrine's own schema is wrong.** It cannot be mine. I don't have one to be wrong.
>
> And that's precisely what we're looking at. Citrine emits `"37.7749"`. Citrine's own schema demands five to seven decimals. **Citrine is failing its own validator.** One call. One finding. Seventeen receipts. In *both directions* — I pull it, and I made Citrine push it, and it's wrong both times.

**[Beat.]**

> Where it stands: **all tests passing, TypeScript builds clean.** Everything you saw is real traffic against the real stack in Docker.
>
> And the piece I'm most pleased with is that `known-bugs/` folder. Every rough edge becomes a **scenario file** — JSON that sets up the state, arms the fault, and asserts the outcome. Not a Jira ticket that rots. An executable fixture that stays red until it's fixed and becomes the regression test the day after.
>
> There's one in there for a genuinely nasty one: Citrine marks `authorization_reference` as required, OCPI marks it optional. So a *correct* partner, omitting a field they're allowed to omit, breaks Citrine's live authorization. A file you can run, not a paragraph in Slack.
>
> **Next step is CI.** Once this runs on every PR, "did we break interop?" stops being a question anyone has to remember to ask.
>
> That's it. What do you want to poke at?

---

## DO NOT TOUCH

| Control | Exact bad outcome | Exact recovery |
|---|---|---|
| **Unregister** | **The truly dangerous one.** `tokenWePresent:""` → *every* outbound call dies `401`/`2002`. Push token and Pull locations both break. Silent until you click something. | `curl -s -X POST localhost:8083/_mock/reset -H 'content-type: application/json' -d '{}'` — restores `registered` + both tokens. **No restart needed.** Do **not** pass `keepRegistration:true` — that re-pins the broken state. |
| **Register** | `502 {"error":"register_failed","message":"generate-credentials-token-a did not return a token"}` — Citrine refuses ("TenantPartner already has credentials token A"). Red toast. | **None needed** — it fails *before* mutating anything. Say the Beat 11 line and move on. |
| **Reset recorder + state** | Not a state risk, a **narrative** risk. Wipes exchanges/findings/faults, **blanks the scenario badge** and drops `registeredAt`. | Nothing to recover — you deleted your evidence. Press only deliberately. |
| **Fault: Module _any_ + Direction _any_** | The dynamic "Delay 2s all." A `delay`/`abort` matching `{}` hits every subsequent call. | `curl -s -X DELETE localhost:8083/_mock/faults`, or the armed-rule `✕`. **Always scope the Module dropdown before arming.** |
| **A fault left armed** | Poisons the next demo click — a failure *you* caused, read as Citrine's. The FAULTS ARMED card is your tell. | `curl -s -X DELETE localhost:8083/_mock/faults`, or **Clear all**. |

### ⚠️ The one inversion that will catch you out

The intuition is backwards here, so read it twice:

- **`reset -d '{}'`** → rebuilds registration **from config** → **RESTORES `registered`** + both tokens. **This is your panic button.**
- **`reset -d '{"keepRegistration":true}'`** → **PRESERVES whatever you currently have**, including a broken unregistered state. **This one cannot rescue you.**

Source: `apps/mock-msp/src/core/Store.ts:252` (`reset()` calls `seedDomain(this.cfg)`, then only re-pins the old registration *if* `keepRegistration`), and `Store.ts:111` (`seedRegistration()` returns `status:'registered'` with both bootstrap tokens).

### Accident scenarios

| Symptom | Do this / say this |
|---|---|
| Red toast, any button | Read it out loud, move on. Don't debug in front of Mason. |
| Badge red `server down` | Tier 2 restart. Header recovers within 2s. |
| **You fat-fingered Unregister** | `reset -d '{}'` restores registration *and* both tokens. Costs you the trace, not the demo. |
| **You clicked Reset** | Nothing to fix — re-run the path. Say: *"That's the reset — it clears the recorder so you get a clean slate per test run."* Don't point at the scenario badge afterward; it's blank. |
| **Armed a fault and forgot it** | The FAULTS ARMED counter is your seatbelt light. **Clear all** or `curl -s -X DELETE localhost:8083/_mock/faults`. Say: *"Let me clear the fault I armed — otherwise I'd be showing you a failure I caused rather than one Citrine produced."* |
| **Provoke returns 502** | Hasura or Citrine OCPI is down. `{"error":"provoke_failed"...}` or `{"error":"hasura_error"...}`. Say: *"That's the Provoke path failing honestly — it writes through Citrine's Hasura, and Hasura isn't answering. The mock isn't pretending it worked."* Fix: Tier 3. |
| **Send command** (if asked or fat-fingered) | `START_SESSION` on the default payload → **valid** command, sync **`REJECTED`** (no live station). Say: *"Well-formed command, real Citrine answer — rejected because there's no physical charger for that location. 'Valid' means the envelope was spec-correct, not that the command succeeded."* Sharper decline: `STOP_SESSION` with `{"session_id":"demo-1"}` → `2001 "Session not found"` / `UNKNOWN_SESSION`. |
| Browser cached an old page | **Ctrl+Shift+R**. *"Hard-refresh — it's a polling page, not a socket."* |
| `live` unticked, screen frozen | Tick **live** or hit **↻**. |
| Window < 900px | Widen, or Ctrl+- to 90%. |
| Mock died | Tier 2 (**~30–60s**, it runs `tsc -b` first — cover it). *"It's a dev-mode mock; a cold start rebuilds. While it does: it's booting an eMSP already credentialed with Citrine, which is why the pull works the moment it's live."* |
| A Citrine container died | Tier 3. *"That's Citrine, not the mock — the mock's telling us the truth about a dead peer, which is precisely its job."* |
| Mason: "can I see request headers?" | *"Recorded, not rendered — that's a gap. The meta line shows routed identity and tracing IDs, which is the 90%."* |

**Distinguish the two failure modes fast:** `ECONNREFUSED` = Citrine is down → Tier 3. `401`/`2002` = tokens are wrong → `reset -d '{}'`.

---

## PANIC BUTTON

**Tier 1 — 90% of accidents, ~1 second.** Fixes: Unregister, any armed fault, dirty table, 401/2002.
```bash
curl -s -X DELETE localhost:8083/_mock/faults; \
curl -s -X POST localhost:8083/_mock/reset -H 'content-type: application/json' -d '{}'; echo; \
curl -s localhost:8083/_mock/health
```
Expect `{"cleared":true}`, `{"reset":true,"keepRegistration":false}`, and health with `"registration":{"status":"registered"}`. That's demo-ready.
⚠️ **`scenario` will be `null` and `registeredAt` gone — both cosmetic. Do not point at the badge afterward.**

**Tier 2 — mock dead, or health won't say `registered`, or you need the badge back. ~30–60s.**
```bash
cd /c/Users/ahmed.aboelezz/Desktop/44/citrineos-core && \
bash apps/mock-msp/scripts/demo-down.sh; bash apps/mock-msp/scripts/demo-up.sh && \
curl -s localhost:8083/_mock/health
```
Restores **everything including `"scenario":"preregistered"` and `registeredAt`**, and `seq` restarts at 1. Idempotent. (Restart, not rebuild, is also how any `dashboard.html` edit takes effect — the file is read once at boot.) Cover the rebuild with the line above.

**Tier 3 — Citrine down (`ECONNREFUSED`) or Provoke 502.**
```bash
docker start citrineos-core-citrineos-ocpi-1 && sleep 5 && \
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8085/ocpi/versions/1
```
Expect `200`. If Provoke specifically 502s, also confirm Hasura: `curl -s -o /dev/null -w "%{http_code}\n" localhost:8090/v1/graphql` (405/400 on GET is fine — it means it's up).

---

## Fallbacks

The Provoke buttons replace the old terminal step, but the CLI paths still work and are worth keeping staged if you'd rather drive Citrine from a shell:

- **Make Citrine push a location (Locations `PUT`):**
  `bash apps/mock-msp/scripts/demo-trigger.sh` — inserts a Location straight into Citrine's DB via `psql`; Citrine broadcasts the `PUT`. Same effect as **Make Citrine push a new location**, minus Hasura.
- **Inbound CDR by hand** (Citrine won't push CDRs without a real transaction, so to see a `cdrs` inbound row you post one yourself):
  ```bash
  cd /c/tmp && source ./h.sh && curl -s -X POST http://localhost:8083/ocpi/2.2.1/emsp/cdrs "${H[@]}" -d @/c/tmp/cdr-demo.json
  ```
  (`h.sh` sets the `Authorization: Token <base64>` + routing/tracing headers; `cdr-demo.json` is a valid CDR body.)

---

## Closing notes

**Verified path:** Push token (#1 clean green) → Pull locations (#2 green/green/red, ~17 issues) → expand → Pull CDRs (#3, second bug, 200/—/✗, 2 issues) → **Make Citrine push a new location** (#4, `C→M` PUT, coordinates bug — the both-directions proof) → **Make Citrine update a location** (#5, `C→M` PATCH, clean) → **Pull all** + coverage grid → build `ocpiStatus 3001` on `locations/inbound` → arm → Provoke to fire → **Clear all** → filters. Every step is real traffic against the live stack.

**On the coordinates line** — the defensible framing: *"High severity, one-line fix. The value is correct — 37.7749 is the right latitude — it's emitted with 4 decimals where the spec's regex demands 5 to 7. A formatting violation on a mandatory field, on 100% of locations. A lenient partner ingests it fine; a spec-strict one rejects every location, and it fails certification."* **Resist upgrading that to "blocker" if Mason gets excited.** The ground truth is the coordinate is *right*, and overselling is the one thing that would cost credibility with a technical peer.

**The `physical_reference` finding is subtler:** `'EVSE-001-PHYSICAL'` is 17 chars against a 16-char cap, and it comes from **seed data** — *not* a Citrine code bug. It demonstrates that **Citrine serves its own data without validating its own output.**

**The CDRs-envelope bug is your strongest technical card** — an *interop* break, not a formatting nit. Carry the caveat: **only observed on the empty-list path; the populated path is untested.**

**"Both directions" is the headline for Mason.** Blue rows are us→Citrine (pull, push token, commands). Green rows are Citrine→us (Provoke add/nudge, plus real-time authorize when a live charger exists). The coverage grid draws both columns; the `n/a locally` cells are the honest edge of what a laptop can provoke.

**On `problems only`:** it requires *error* severity. `pull.cdrs` shows; `pull.tokens` (warn) silently hides. That asymmetry is the honest answer if Mason asks whether the filter is trustworthy.

**Files:** `apps/mock-msp/public/dashboard.html` · `src/control/controlApi.ts` (`/_mock/provoke/:what`, `/_mock/coverage`, command defaults) · `src/config.ts` (`CITRINE_HASURA_URL`) · `src/core/Store.ts` · `src/core/client.ts` · `src/ocpi/barrel.ts` · `scenarios/` · fallback CDR payload `c:\tmp\cdr-demo.json`, headers `c:\tmp\h.sh`
