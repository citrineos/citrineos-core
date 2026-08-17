// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type Locator, type Page } from '@playwright/test';

// CommandBar — composition POM for the charging-station detail page's
// command buttons. Every primary command renders a translated text label
// inside a Button element, so accessible queries reach every button without
// a data-testid. Modals reachable only through the OtherCommandsModal
// dispatcher are opened via `openViaOtherCommands(name)`.

export class CommandBar {
  readonly resetButton: Locator;
  readonly remoteStartButton: Locator;
  readonly remoteStopButton: Locator;
  readonly forceDisconnectButton: Locator;
  readonly otherCommandsButton: Locator;

  constructor(private readonly page: Page) {
    this.resetButton = page.getByRole('button', { name: /^reset$/i });
    this.remoteStartButton = page.getByRole('button', {
      name: /(remote start|start transaction)/i,
    });
    this.remoteStopButton = page.getByRole('button', {
      name: /(remote stop|stop transaction)/i,
    });
    this.forceDisconnectButton = page.getByRole('button', {
      name: /force disconnect/i,
    });
    this.otherCommandsButton = page.getByRole('button', {
      name: /other commands/i,
    });
  }

  async clickByName(buttonNamePattern: RegExp): Promise<void> {
    await this.page.getByRole('button', { name: buttonNamePattern }).first().click();
  }

  // Opens the OtherCommandsModal, then selects a sub-command from its
  // dispatcher list (e.g., "Get Variables", "Set Variables", etc.). Used
  // by the parametric harness for modals not exposed as primary buttons.
  async openViaOtherCommands(commandNamePattern: RegExp): Promise<void> {
    await this.otherCommandsButton.click();
    await this.page.getByRole('dialog').first().waitFor({ state: 'visible', timeout: 30_000 });
    const entry = this.page
      .getByRole('option', { name: commandNamePattern })
      .or(this.page.getByRole('menuitem', { name: commandNamePattern }))
      .or(this.page.getByRole('button', { name: commandNamePattern }))
      .first();
    await entry.waitFor({ state: 'visible', timeout: 30_000 });
    await entry.click();
  }
}
