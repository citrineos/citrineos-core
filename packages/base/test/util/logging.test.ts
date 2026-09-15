// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger, loggerDefaults, MASKED_LOG_KEYS } from '@base-util/logging.js';
import { type ILogObj, type ILogObjMeta, Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';

const SECRET = 'hunter2';

function aLogger(env = 'production') {
  const written: (ILogObj & ILogObjMeta)[] = [];
  const logger = new Logger<ILogObj>({
    ...loggerDefaults(env),
    name: 'test',
    minLevel: 0,
    type: 'hidden',
  });
  logger.attachTransport((record) => {
    written.push(record);
  });
  return { logger, written };
}

const everythingWritten = (written: (ILogObj & ILogObjMeta)[]) => JSON.stringify(written);

describe('loggerDefaults', () => {
  describe('masking', () => {
    it('masks a password at the top level of a logged object', () => {
      const { logger, written } = aLogger();

      logger.info('auth', { password: SECRET, stationId: 'cp-1' });

      expect(everythingWritten(written)).not.toContain(SECRET);
      expect(everythingWritten(written)).toContain('cp-1');
    });

    it('masks a password nested inside an object or an array', () => {
      const { logger, written } = aLogger();

      logger.info('nested', {
        outer: { inner: { password: SECRET } },
        list: [{ password: SECRET }],
      });

      expect(everythingWritten(written)).not.toContain(SECRET);
    });

    it('masks through a sub-logger, which is how every module gets its logger', () => {
      const { logger, written } = aLogger();

      logger.getSubLogger({ name: 'AuthorizeHandler' }).warn('rejected', { password: SECRET });

      expect(everythingWritten(written)).not.toContain(SECRET);
    });

    it('masks every key in MASKED_LOG_KEYS, so adding one there is all it takes', () => {
      const { logger, written } = aLogger();

      for (const key of MASKED_LOG_KEYS) {
        logger.info('probe', { [key]: SECRET });
      }

      expect(MASKED_LOG_KEYS.length).toBeGreaterThan(0);
      expect(everythingWritten(written)).not.toContain(SECRET);
    });
  });

  describe('code position capture', () => {
    it('resolves a log position outside production', () => {
      const { logger, written } = aLogger('development');

      logger.info('x');

      expect(written[0]._logMeta?.path).toBeDefined();
    });

    it('skips the stack capture in production', () => {
      const { logger, written } = aLogger('production');

      logger.info('x');

      expect(written[0]._logMeta?.path).toBeUndefined();
    });
  });
});

describe('childLogger', () => {
  /** Captures what a logger writes, whether it was built here or handed in. */
  function capture(logger: Logger<ILogObj>) {
    const written: (ILogObj & ILogObjMeta)[] = [];
    logger.attachTransport((record) => {
      written.push(record);
    });
    return written;
  }

  it('names the child after the collaborator and records the parent', () => {
    const { logger: parent, written } = aLogger();

    childLogger(parent, 'RedisCache').info('connected');

    expect(written[0]._logMeta?.name).toBe('RedisCache');
    expect(written[0]._logMeta?.parentNames).toEqual(['test']);
  });

  it('masks when there is no parent to inherit from', () => {
    // The case that regressed on v5: a bare `new Logger()` masks nothing, and 45 collaborators
    // build their logger this way when none is injected.
    const orphan = childLogger(undefined, 'RedisCache');
    orphan.settings.type = 'hidden';
    const written = capture(orphan);

    orphan.info('connected', { password: SECRET });

    expect(JSON.stringify(written)).not.toContain(SECRET);
  });

  it('does not touch fallbackSettings when a parent was given', () => {
    // Regression: constructors here build their logger before assigning their fields, so
    // `() => ({ ...loggerDefaults(this._config.env) })` throws if it is called on the parent path.
    const { logger: parent } = aLogger();
    const fallback = vi.fn(() => ({ minLevel: 6 }));

    childLogger(parent, 'OcppSender', fallback);

    expect(fallback).not.toHaveBeenCalled();
  });

  it('applies fallbackSettings only when it builds the logger itself', () => {
    const orphan = childLogger(undefined, 'Module', () => ({ minLevel: 6 }));
    expect(orphan.settings.minLevel).toBe(6);

    const { logger: parent } = aLogger();
    // The parent already carries the settings a child should inherit, so they are not overridden.
    expect(childLogger(parent, 'Module', () => ({ minLevel: 6 })).settings.minLevel).toBe(0);
  });
});
