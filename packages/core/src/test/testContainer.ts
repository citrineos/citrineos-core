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
import { vi, type Mock } from 'vitest';

type AnyClass = Constructor<object>;

// The deps object the class constructor destructures. Partial because logger is pre-registered
// and Awilix strict:true enforces any other missing dep at resolve time.
type Deps<T extends AnyClass> = Partial<ConstructorParameters<T>[0]>;

const TARGET_KEY = '__target';

export type MockLogger = {
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
  };
  return logger;
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
