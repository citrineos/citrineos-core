// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
// SPDX-License-Identifier: Apache-2.0
import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
  type Constructor,
} from 'awilix';
import { type ILogObj, type Logger } from 'tslog';
import { vi, type Mock } from 'vitest';

type AnyClass = Constructor<object>;

// The deps object the class constructor destructures. Partial at two levels:
//
//  - the outer level because logger is pre-registered and Awilix strict:true
//    enforces any other missing dep at resolve time;
//  - each individual dep because a test double only ever stubs the members the
//    code under test actually calls. The interfaces they stand in for are large
//    (ILocationRepository has 16 members, ITransactionEventRepository 14), so
//    demanding the full surface produced ~70 "is missing the following
//    properties" errors across the suite.
//
// Members that ARE stubbed stay typechecked: a misspelled name is an excess
// property and a wrong signature still fails, so this admits omissions without
// giving up on the parts a test actually asserts against.
export type Deps<T extends AnyClass> = {
  [K in keyof ConstructorParameters<T>[0]]?: Partial<ConstructorParameters<T>[0][K]>;
};

const TARGET_KEY = '__target';

// Intersected with Logger<ILogObj> so it can be passed wherever a real tslog
// logger is expected. tslog's Logger has ~20 members (log, silly, runtime,
// stackDepthLevel, ...) that a test double has no reason to implement, and
// without this every `new Handler({ logger, ... })` reported "Type 'MockLogger'
// is missing the following properties". The Mock-typed members stay Mocks, so
// assertions like logger.debug.mock.calls keep working.
export type MockLogger = Logger<ILogObj> & {
  debug: Mock;
  info: Mock;
  warn: Mock;
  error: Mock;
  fatal: Mock;
  trace: Mock;
  // Real function so it survives vi.restoreAllMocks() between tests.
  getSubLogger: (...args: unknown[]) => MockLogger;
};

function makeDefaultLogger(): MockLogger {
  // getSubLogger returns the same mock; the self-reference is safe because the
  // arrow is never called during construction.
  const logger: MockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    getSubLogger: () => logger,
    // Asserted once here rather than at every call site: the literal covers the
    // members tests use, and the rest of tslog's Logger surface is unreachable
    // from a test double. The annotation above is what types the self-reference.
  } as unknown as MockLogger;
  return logger;
}

export type MockOcppSender = {
  sendCall: Mock;
  sendCallResult: Mock;
  sendCallResultWithMessage: Mock;
  sendCallError: Mock;
  sendCallErrorWithMessage: Mock;
};

/**
 * Every {@link AbstractModule} now requires an `ocppSender` dependency. Tests that construct a
 * module via {@link getTestInstance} without providing one fail to resolve at construction time,
 * so this gives a ready-made mock to pass as `{ ocppSender: makeMockOcppSender() }`.
 */
export function makeMockOcppSender(): MockOcppSender {
  return {
    sendCall: vi.fn().mockResolvedValue({ success: true }),
    sendCallResult: vi.fn().mockResolvedValue({ success: true }),
    sendCallResultWithMessage: vi.fn().mockResolvedValue({ success: true }),
    sendCallError: vi.fn().mockResolvedValue({ success: true }),
    sendCallErrorWithMessage: vi.fn().mockResolvedValue({ success: true }),
  };
}

/**
 * Types a deps object for a class the test constructs itself with `new`, the
 * same way Deps<T> types the ones getTestInstance resolves: each dep may be
 * partial, and the members that are present stay checked.
 *
 * Keeps direct-construction tests on the same footing as container-resolved
 * ones without having to import each dependency interface just to name it.
 */
export function mockDeps<T extends AnyClass>(deps: Deps<T>): ConstructorParameters<T>[0] {
  return deps as ConstructorParameters<T>[0];
}

function toValueResolvers(deps: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(deps).map(([key, value]) => [key, asValue(value)]));
}

/**
 * Creates a shared Awilix container for a test file, pre-registered with a
 * vi.fn()-based mock logger. Returns both the container and the logger so tests
 * can assert on log calls without any type cast.
 *
 * Usage (top of describe block):
 *   const { container, logger } = createTestContainer();
 */
export function createTestContainer(): { container: AwilixContainer; logger: MockLogger } {
  const container = createContainer({ injectionMode: InjectionMode.PROXY, strict: true });
  const logger = makeDefaultLogger();
  container.register({ logger: asValue(logger) });
  return { container, logger };
}

/**
 * Registers the given class and its mocks into the shared container, then
 * resolves and returns the instance. Call this in beforeEach to get a fresh
 * instance each test (re-registration overwrites the previous entry).
 *
 * Usage:
 *   service = getTestInstance(container, BasicAuthenticationFilter, {
 *     deviceModelRepository: mockRepo,
 *   });
 */
export function getTestInstance<T extends AnyClass>(
  container: AwilixContainer,
  instance: T,
  mocks: Deps<T>,
): InstanceType<T> {
  container.register({
    ...toValueResolvers(mocks as Record<string, unknown>),
    [TARGET_KEY]: asClass(instance),
  });
  return container.resolve<InstanceType<T>>(TARGET_KEY);
}
