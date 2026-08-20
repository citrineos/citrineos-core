// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page, expect } from '@playwright/test';
import { CommandBar } from '../components/command-bar.po';

interface DetailTabs {
  readonly evses: Locator;
  readonly connectors: Locator;
  readonly messages: Locator;
  readonly configuration: Locator;
}

export class ChargingStationDetailPage {
  // Refine's hasura-default data provider is configured with `idType: 'Int'`
  // and the route binds to `ChargingStations_by_pk(id: Int!)`. The int PK
  // column is `id`; the string OCPP identifier is `ocppConnectionName`.
  // Specs pass the seeded station's `.id`.
  static path(id: number | string): string {
    return `/charging-stations/${id}`;
  }
  static readonly urlGlob = '**/charging-stations/*';

  readonly heading: Locator;
  readonly statusTag: Locator;
  readonly commandBar: CommandBar;
  readonly tabs: DetailTabs;

  constructor(private readonly page: Page) {
    // The detail card uses the station id as its visible heading.
    this.heading = page.getByRole('heading').first();
    this.statusTag = page.getByText(/^(online|offline)$/i).first();
    this.commandBar = new CommandBar(page);
    this.tabs = {
      evses: page.getByRole('tab', { name: /^evses$/i }),
      connectors: page.getByRole('tab', { name: /^connectors$/i }),
      messages: page.getByRole('tab', { name: /(ocpp )?messages/i }),
      configuration: page.getByRole('tab', { name: /configuration/i }),
    };
  }

  async goto(id: number | string): Promise<void> {
    await this.page.goto(ChargingStationDetailPage.path(id), {
      waitUntil: 'domcontentloaded',
    });
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    // Detail page is interactive when the command bar's Reset button (always
    // rendered for any non-deleted station) becomes visible. Under sustained
    // load the server can hang for the full window without finishing its
    // response — a one-shot reload unsticks it. Budgets mirror the overview
    // page: 45 + 30 reload + 60 = 135s, inside the 150s test timeout (the
    // old 60+60+60 shape overran it and died as a bare test timeout). In
    // practice the first attempt resolves in 5–20s.
    try {
      await expect(this.commandBar.resetButton).toBeVisible({
        timeout: 45_000,
      });
    } catch {
      await this.page.reload({
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await expect(this.commandBar.resetButton).toBeVisible({
        timeout: 60_000,
      });
    }
  }

  // EVSE tab — open and verify rows are listed. Row identification is by
  // the EVSE Type ID column (left-most), which is unique per station.
  async openEvsesTab(): Promise<void> {
    await this.tabs.evses.click();
    await expect(this.page.getByRole('button', { name: /add new evse/i })).toBeVisible({
      timeout: 30_000,
    });
  }

  evseRowByTypeId(evseTypeId: number | string): Locator {
    return this.page.getByRole('row').filter({ hasText: String(evseTypeId) });
  }

  // Connector add via the EVSE row's "Add Connector" button. Clicks open
  // a Radix Dialog with the ConnectorsUpsert form.
  async clickAddConnectorOnEvse(evseTypeId: number | string): Promise<void> {
    await this.evseRowByTypeId(evseTypeId)
      .getByRole('button', { name: /add connector/i })
      .click();
  }

  // OCPP Messages tab — verify it surfaces the latest BootNotification or
  // StatusNotification for an EVerest-attached station.
  async openMessagesTab(): Promise<void> {
    await this.tabs.messages.click();
  }
}
