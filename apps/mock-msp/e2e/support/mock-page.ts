// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { expect, type Locator, type Page } from '@playwright/test';

const SECRET = process.env.MOCK_MSP_CONTROL_SECRET;
export const SECRET_KEY = 'mockmsp.secret';

/** The dashboard at GET /. Element ids are the ones in public/dashboard.html. */
export class MockPage {
  readonly identity: Locator;
  readonly regBadge: Locator;
  readonly scenarioBadge: Locator;
  readonly stamp: Locator;
  readonly autoChk: Locator;
  readonly refreshBtn: Locator;
  readonly cExch: Locator;
  readonly cFind: Locator;
  readonly cFault: Locator;
  readonly cReg: Locator;
  readonly cAuth: Locator;
  readonly covGrid: Locator;
  readonly fDir: Locator;
  readonly fSearch: Locator;
  readonly fFail: Locator;
  readonly shownCount: Locator;
  readonly rows: Locator;
  readonly emptyMsg: Locator;
  readonly findings: Locator;
  readonly faultList: Locator;
  readonly secret: Locator;
  readonly toast: Locator;
  readonly cmdType: Locator;
  readonly cmdPayload: Locator;
  readonly chOut: Locator;
  readonly probeOut: Locator;
  readonly fbModule: Locator;
  readonly fbDir: Locator;
  readonly fbKind: Locator;
  readonly fbParams: Locator;
  readonly pageErrors: Error[] = [];

  constructor(readonly page: Page) {
    const $ = (id: string) => page.locator(`#${id}`);
    this.identity = $('identity');
    this.regBadge = $('regBadge');
    this.scenarioBadge = $('scenarioBadge');
    this.stamp = $('stamp');
    this.autoChk = $('autoChk');
    this.refreshBtn = $('refreshBtn');
    this.cExch = $('cExch');
    this.cFind = $('cFind');
    this.cFault = $('cFault');
    this.cReg = $('cReg');
    this.cAuth = $('cAuth');
    this.covGrid = $('covGrid');
    this.fDir = $('fDir');
    this.fSearch = $('fSearch');
    this.fFail = $('fFail');
    this.shownCount = $('shownCount');
    this.rows = page.locator('#rows tr.x');
    this.emptyMsg = $('emptyMsg');
    this.findings = $('findings');
    this.faultList = $('faultList');
    this.secret = $('secret');
    this.toast = page.locator('#toast .t');
    this.cmdType = $('cmdType');
    this.cmdPayload = $('cmdPayload');
    this.chOut = $('chOut');
    this.probeOut = $('probeOut');
    this.fbModule = $('fbModule');
    this.fbDir = $('fbDir');
    this.fbKind = $('fbKind');
    this.fbParams = $('fbParams');
    page.on('pageerror', (e) => this.pageErrors.push(e));
  }

  /** Load the dashboard; pre-seed the control secret when the mock requires one. */
  async open(path = '/'): Promise<void> {
    if (SECRET) {
      await this.page.addInitScript(([k, v]) => localStorage.setItem(k, v), [
        SECRET_KEY,
        SECRET,
      ] as const);
    }
    await this.page.goto(path);
    await expect(this.identity).not.toHaveText('…');
  }

  /** Click refresh and wait for the next poll to land. */
  async refresh(): Promise<void> {
    const before = await this.stamp.textContent();
    await this.refreshBtn.click();
    await expect(this.stamp).not.toHaveText(before ?? '');
  }

  button(text: string | RegExp): Locator {
    return this.page.getByRole('button', { name: text });
  }

  row(seq: number | string): Locator {
    return this.page.locator('#rows tr.x').filter({
      has: this.page.locator('td:first-child', { hasText: new RegExp(`^${seq}$`) }),
    });
  }

  detailRow(): Locator {
    return this.page.locator('#rows tr.detail');
  }

  faultEntries(): Locator {
    return this.faultList.locator('> div');
  }

  async selectFaultKind(kind: string): Promise<void> {
    await this.fbKind.selectOption(kind);
  }

  async lastToast(): Promise<string> {
    return (await this.toast.last().textContent()) ?? '';
  }
}
