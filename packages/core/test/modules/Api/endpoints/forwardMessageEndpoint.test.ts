// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  buildMessageEndpoints,
  forwardMessageEndpoint,
  DEFAULT_TENANT_ID,
  type MessageEndpointClass,
  type IEndpointBuilder,
} from '@citrineos/base';
import { EventGroup, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { asValue, createContainer, InjectionMode, type AwilixContainer } from 'awilix';
import { Logger, type ILogObj } from 'tslog';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const BODY_SCHEMA = { $id: 'ResetRequestSchema', type: 'object' };

const ResetEndpoint = forwardMessageEndpoint({
  action: OCPP_CallAction.Reset,
  protocols: [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  eventGroup: EventGroup.Configuration,
  bodySchema: () => BODY_SCHEMA,
});

describe('forwardMessageEndpoint', () => {
  let sendCall: ReturnType<typeof vi.fn>;
  let container: AwilixContainer;

  const buildEndpoint = () => {
    const endpointClasses: ReadonlyArray<MessageEndpointClass> = [ResetEndpoint];
    // buildMessageEndpoints takes an IEndpointBuilder, whose build() declares
    // `new (...args: never[]) => T`. awilix's container.build() wants
    // `new (...args: any[]) => T`, and under strictFunctionTypes those are
    // contravariantly incompatible even though the call is correct at runtime,
    // so the target is re-cast at that boundary.
    const builder: IEndpointBuilder = {
      build: <T>(target: new (...args: never[]) => T) =>
        container.build(target as unknown as new (...args: any[]) => T),
    };
    return buildMessageEndpoints(builder, endpointClasses)[0];
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockImplementation(async ({ ocppConnectionName }) => ({
      success: true,
      payload: ocppConnectionName,
    }));
    container = createContainer({ injectionMode: InjectionMode.PROXY, strict: true });
    container.register({
      logger: asValue(new Logger<ILogObj>({ type: 'hidden' })),
      ocppSender: asValue({ sendCall }),
    });
  });

  it('exposes the declaration it was built from as a static route', () => {
    expect(ResetEndpoint.route).toMatchObject({
      action: OCPP_CallAction.Reset,
      protocols: [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
      eventGroup: EventGroup.Configuration,
    });
  });

  it('carries the route onto the built entry', () => {
    expect(buildEndpoint().route).toBe(ResetEndpoint.route);
  });

  it('resolves the body schema for every declared protocol', () => {
    expect(ResetEndpoint.route.bodySchema(OCPPVersion.OCPP2_0_1)).toBe(BODY_SCHEMA);
    expect(ResetEndpoint.route.bodySchema(OCPPVersion.OCPP2_1)).toBe(BODY_SCHEMA);
  });

  it('sends one call per identifier', async () => {
    const { endpoint } = buildEndpoint();

    await endpoint.handle(['cs001', 'cs002'], {}, undefined, 1, OCPPVersion.OCPP2_0_1);

    expect(sendCall.mock.calls.map((call) => call[0].ocppConnectionName)).toEqual([
      'cs001',
      'cs002',
    ]);
  });

  it('forwards the request payload unchanged', async () => {
    const { endpoint } = buildEndpoint();
    const request = { type: 'Immediate', evseId: 3 };

    await endpoint.handle(['cs001'], request, undefined, 1, OCPPVersion.OCPP2_0_1);

    expect(sendCall.mock.calls[0][0].payload).toBe(request);
  });

  it('tags every call with the declared action and event group', async () => {
    const { endpoint } = buildEndpoint();

    await endpoint.handle(['cs001'], {}, undefined, 1, OCPPVersion.OCPP2_0_1);

    expect(sendCall.mock.calls[0][0]).toMatchObject({
      action: OCPP_CallAction.Reset,
      eventGroup: EventGroup.Configuration,
    });
  });

  it('passes the request version through as the protocol', async () => {
    const { endpoint } = buildEndpoint();

    await endpoint.handle(['cs001'], {}, undefined, 1, OCPPVersion.OCPP2_1);

    expect(sendCall.mock.calls[0][0].protocol).toBe(OCPPVersion.OCPP2_1);
  });

  it('falls back to the default tenant when none was supplied', async () => {
    const { endpoint } = buildEndpoint();

    await endpoint.handle(['cs001'], {}, undefined, undefined, OCPPVersion.OCPP2_0_1);

    expect(sendCall.mock.calls[0][0].tenantId).toBe(DEFAULT_TENANT_ID);
  });

  it('keeps an explicit tenant id', async () => {
    const { endpoint } = buildEndpoint();

    await endpoint.handle(['cs001'], {}, undefined, 42, OCPPVersion.OCPP2_0_1);

    expect(sendCall.mock.calls[0][0].tenantId).toBe(42);
  });

  it('forwards the callback url when one was supplied', async () => {
    const { endpoint } = buildEndpoint();

    await endpoint.handle(['cs001'], {}, 'http://cb', 1, OCPPVersion.OCPP2_0_1);

    expect(sendCall.mock.calls[0][0].callbackUrl).toBe('http://cb');
  });

  it('returns one confirmation per identifier, in order', async () => {
    const { endpoint } = buildEndpoint();

    const confirmations = await endpoint.handle(
      ['cs001', 'cs002'],
      {},
      undefined,
      1,
      OCPPVersion.OCPP2_0_1,
    );

    expect(confirmations).toEqual([
      { success: true, payload: 'cs001' },
      { success: true, payload: 'cs002' },
    ]);
  });

  it('sends nothing when no identifiers were supplied', async () => {
    const { endpoint } = buildEndpoint();

    const confirmations = await endpoint.handle([], {}, undefined, 1, OCPPVersion.OCPP2_0_1);

    expect(confirmations).toEqual([]);
    expect(sendCall).not.toHaveBeenCalled();
  });
});
