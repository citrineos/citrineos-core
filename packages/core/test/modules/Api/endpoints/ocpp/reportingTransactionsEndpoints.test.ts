// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP2_0_1, OCPP2_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetCustomReportEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/reporting/GetCustomReportEndpoint.js';
import { GetMonitoringReportEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/reporting/GetMonitoringReportEndpoint.js';
import { SetDefaultTariffEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/transactions/SetDefaultTariffEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const STATION = 'cs001';
const OTHER_STATION = 'cs002';

function aComponentVariable(name: string): OCPP2_0_1.ComponentVariableType {
  return { component: { name: 'Ctrlr' }, variable: { name } };
}

describe('reporting and transactions message endpoints', () => {
  const { container } = createTestContainer();

  let sendCall: ReturnType<typeof vi.fn>;
  let getItemsPerMessage: ReturnType<typeof vi.fn>;
  let getBytesPerMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
    getItemsPerMessage = vi.fn().mockResolvedValue(undefined);
    getBytesPerMessage = vi.fn().mockResolvedValue(undefined);
  });

  const deviceModelService = () => ({
    getItemsPerMessageByComponentAndVariableInstanceAndStationId: getItemsPerMessage,
    getBytesPerMessageByComponentAndVariableInstanceAndStationId: getBytesPerMessage,
  });

  describe('GetCustomReportEndpoint', () => {
    const build = () =>
      getTestInstance(container, GetCustomReportEndpoint, {
        ocppSender: { sendCall },
        deviceModelService: deviceModelService(),
      });

    const handle = (request: OCPP2_0_1.GetReportRequest, identifiers = [STATION]) =>
      build().handle(identifiers, request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends a single call when no component variables are requested', async () => {
      const confirmations = await handle({ requestId: 1 });

      expect(sendCall).toHaveBeenCalledTimes(1);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.GetReport,
        eventGroup: EventGroup.Reporting,
      });
      expect(confirmations).toHaveLength(1);
    });

    it('refuses a request larger than the station byte limit', async () => {
      getBytesPerMessage.mockResolvedValue(1);

      const confirmations = await handle({ requestId: 1 });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('The request is too big');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('batches component variables by itemsPerMessage', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({
        requestId: 1,
        componentVariable: [aComponentVariable('A'), aComponentVariable('B')],
      });

      expect(sendCall).toHaveBeenCalledTimes(2);
      expect(sendCall.mock.calls.map((call) => call[0].payload.componentVariable)).toEqual([
        [aComponentVariable('A')],
        [aComponentVariable('B')],
      ]);
    });

    it('keeps the other request fields on each batch', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({
        requestId: 42,
        componentVariable: [aComponentVariable('A'), aComponentVariable('B')],
      });

      for (const call of sendCall.mock.calls) {
        expect(call[0].payload.requestId).toBe(42);
      }
    });

    it('returns one confirmation per station', async () => {
      const confirmations = await handle({ requestId: 1 }, [STATION, OTHER_STATION]);

      expect(confirmations).toHaveLength(2);
      expect(sendCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('GetMonitoringReportEndpoint', () => {
    const build = () =>
      getTestInstance(container, GetMonitoringReportEndpoint, {
        ocppSender: { sendCall },
        deviceModelService: deviceModelService(),
      });

    const handle = (request: OCPP2_0_1.GetMonitoringReportRequest, identifiers = [STATION]) =>
      build().handle(identifiers, request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends one call per station when no component variables are requested', async () => {
      const confirmations = await handle({ requestId: 1 }, [STATION, OTHER_STATION]);

      expect(sendCall).toHaveBeenCalledTimes(2);
      expect(confirmations).toHaveLength(2);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.GetMonitoringReport,
        eventGroup: EventGroup.Reporting,
      });
    });

    it('batches component variables and labels confirmations with the station', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      const confirmations = await handle({
        requestId: 1,
        componentVariable: [aComponentVariable('A'), aComponentVariable('B')],
      });

      expect(sendCall).toHaveBeenCalledTimes(2);
      for (const confirmation of confirmations) {
        expect(String(confirmation.payload)).toContain(STATION);
      }
    });

    it('captures a send failure as an unsuccessful batch', async () => {
      getItemsPerMessage.mockResolvedValue(1);
      sendCall.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
        success: true,
        payload: 'queued',
      });

      const confirmations = await handle({
        requestId: 1,
        componentVariable: [aComponentVariable('A'), aComponentVariable('B')],
      });

      expect(confirmations).toHaveLength(2);
      expect(confirmations.some((confirmation) => !confirmation.success)).toBe(true);
    });
  });

  describe('SetDefaultTariffEndpoint', () => {
    const build = () =>
      getTestInstance(container, SetDefaultTariffEndpoint, { ocppSender: { sendCall } });

    const aTariff = (
      override: Partial<OCPP2_1.TariffType> = {},
    ): OCPP2_1.SetDefaultTariffRequest => ({
      evseId: 1,
      tariff: {
        tariffId: 'tariff-1',
        currency: 'USD',
        ...override,
      },
    });

    it('is declared for OCPP 2.1', () => {
      expect(SetDefaultTariffEndpoint.route.action).toBe(OCPP_CallAction.SetDefaultTariff);
      expect(SetDefaultTariffEndpoint.route.protocols).toContain(OCPPVersion.OCPP2_1);
    });

    it('sends a tariff that passes time-field validation', async () => {
      const confirmations = await build().handle(
        [STATION],
        aTariff(),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
      );

      expect(confirmations).toEqual([{ success: true, payload: 'queued' }]);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.SetDefaultTariff,
        eventGroup: EventGroup.Transactions,
      });
    });

    it('falls back to the default tenant when none is supplied', async () => {
      await build().handle([STATION], aTariff(), undefined, undefined, OCPPVersion.OCPP2_1);

      expect(sendCall.mock.calls[0][0].tenantId).toBe(DEFAULT_TENANT_ID);
    });

    it('fans out to every identifier', async () => {
      await build().handle(
        [STATION, OTHER_STATION],
        aTariff(),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
      );

      expect(sendCall.mock.calls.map((call) => call[0].ocppConnectionName)).toEqual([
        STATION,
        OTHER_STATION,
      ]);
    });

    it('rejects a startTimeOfDay that is not in hh:mm form, without sending', async () => {
      const confirmations = await build().handle(
        [STATION],
        aTariff({
          energy: { prices: [{ priceKwh: 1, conditions: { startTimeOfDay: 'not-a-time' } }] },
        }),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
      );

      expect(confirmations).toHaveLength(1);
      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('startTimeOfDay');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('rejects an invalid endTimeOfDay, without sending', async () => {
      const confirmations = await build().handle(
        [STATION],
        aTariff({
          energy: { prices: [{ priceKwh: 1, conditions: { endTimeOfDay: '25:00' } }] },
        }),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
      );

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('endTimeOfDay');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('accepts well-formed time-of-day conditions', async () => {
      const confirmations = await build().handle(
        [STATION],
        aTariff({
          energy: {
            prices: [
              { priceKwh: 1, conditions: { startTimeOfDay: '08:30', endTimeOfDay: '20:00' } },
            ],
          },
        }),
        undefined,
        DEFAULT_TENANT_ID,
        OCPPVersion.OCPP2_1,
      );

      expect(confirmations[0].success).toBe(true);
      expect(sendCall).toHaveBeenCalledTimes(1);
    });
  });
});
