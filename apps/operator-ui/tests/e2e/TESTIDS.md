<!--
SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

# `data-testid` Registry

**Status:** Deferred. Per a binding constraint from the project owner, no
modifications may be made to `src/`. The current suite ships using
accessible queries only — see `tests/e2e/pages/overview-page.ts` and the
spec files for the actual selectors in use.

This file is the canonical place to declare any `data-testid`s that get
added later. When the `src/` constraint is lifted, the entries below are
first-priority additions.

## Selectors in use today

- KPI cards anchored by their `<h2>` headings (Charger Online Status, Active Transactions, Plug-In Success Rate, Charger Activity).
- Welcome modal anchored by its dialog role + accessible name "Welcome to CitrineOS Operator UI".
- Theme toggle and Logout buttons require expanding the sidebar (the collapse toggle has `aria-label="Expand sidebar"`); once expanded, they expose visible text labels ("Light Mode" / "Dark Mode" / "Logout").
- The Faulted Chargers list is anchored by its `<h4>` heading.
- Login form: `Email` and `Password` labeled textboxes, `Sign in` button reachable via `getByRole`/`getByLabel`.

## Future backlog

- [ ] `kpi-online-stations`
- [ ] `kpi-active-transactions`
- [ ] `kpi-plugin-success`
- [ ] `kpi-issues`
- [ ] `welcome-modal`
- [ ] `theme-toggle`
- [ ] `station-list-row`
- [ ] `station-status-tag`
- [ ] `ocpp-message-row`
- [ ] `command-remotestart-button`
- [ ] `command-remotestop-button`
- [ ] `command-reset-button`
- [ ] `command-changeavailability-button`
- [ ] `command-triggermessage-button`
- [ ] `command-getvariables-button`
- [ ] `command-setvariables-button`
- [ ] `command-updatefirmware-button`
- [ ] `command-unlockconnector-button`
- [ ] `command-forcedisconnect-button`
- [ ] `reset-modal-confirm`
- [ ] `remotestart-modal-confirm`
- [ ] `getvariables-result-row`
- [ ] `evses-tab-row`
- [ ] `connectors-tab-row`
- [ ] `configuration-tab-row`
- [ ] `transaction-list-row`
- [ ] `transaction-cost`
- [ ] `chart-power`
- [ ] `chart-energy`
- [ ] `chart-voltage`
- [ ] `chart-current`
- [ ] `chart-soc`
- [ ] `filter-station-id`
- [ ] `filter-date-range`
- [ ] `filter-active-only`
