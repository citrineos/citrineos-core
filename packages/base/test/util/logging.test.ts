// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger, loggerDefaults, MASKED_LOG_KEYS } from '@base-util/logging.js';
import { type LogRedactionConfig, logRedactionSchema } from '@citrineos/types';
import { type ILogObj, type ILogObjMeta, Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';

const SECRET = 'hunter2';

/** A redaction config with the schema's defaults, so each test states only what it is about. */
const configured = (overrides: Partial<LogRedactionConfig>): LogRedactionConfig =>
  logRedactionSchema.parse({ ...overrides });

function aLogger(env = 'production', redaction?: Partial<LogRedactionConfig>) {
  const written: (ILogObj & ILogObjMeta)[] = [];
  const logger = new Logger<ILogObj>({
    ...loggerDefaults(env, redaction === undefined ? undefined : configured(redaction)),
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

  describe('driven by logRedaction config', () => {
    it('masks the keys the config names instead of the built-in default', () => {
      const { logger, written } = aLogger('production', { keys: ['clientSecret'] });

      logger.info('oidc', { clientSecret: SECRET });

      expect(everythingWritten(written)).not.toContain(SECRET);
    });

    it('masks a key regardless of its capitalization', () => {
      const { logger, written } = aLogger('production', { keys: ['password'] });

      logger.info('auth', { Password: SECRET, PASSWORD: SECRET });

      expect(everythingWritten(written)).not.toContain(SECRET);
    });

    it('masks a configured dotted path', () => {
      const { logger, written } = aLogger('production', { paths: ['credentials.token'] });

      logger.info({ credentials: { token: SECRET, url: 'https://example.test' } });

      expect(everythingWritten(written)).not.toContain(SECRET);
      expect(everythingWritten(written)).toContain('https://example.test');
    });

    it('masks a path with a wildcard segment', () => {
      const { logger, written } = aLogger('production', { paths: ['*.token'] });

      logger.info({ partner: { token: SECRET } });

      expect(everythingWritten(written)).not.toContain(SECRET);
    });

    it('masks every part of a string a configured pattern matches, not just the first', () => {
      // A non-global regex would censor one occurrence and leave the rest in plaintext.
      const { logger, written } = aLogger('production', { patterns: ['sk-[A-Za-z0-9]+'] });

      logger.info(`first sk-aaa111 then sk-bbb222`);

      expect(everythingWritten(written)).not.toContain('sk-aaa111');
      expect(everythingWritten(written)).not.toContain('sk-bbb222');
    });

    it('writes the configured placeholder in place of a masked value', () => {
      const { logger, written } = aLogger('production', {
        keys: ['password'],
        placeholder: '[gone]',
      });

      logger.info('auth', { password: SECRET });

      expect(everythingWritten(written)).toContain('[gone]');
    });

    it('rejects a pattern that is not a valid regular expression at config load', () => {
      // Better here than as a throw from deep inside logger construction at boot.
      expect(() => logRedactionSchema.parse({ patterns: ['(unclosed'] })).toThrow();
    });

    it('defaults to masking password when the config says nothing', () => {
      expect(logRedactionSchema.parse({}).keys).toEqual([...MASKED_LOG_KEYS]);
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
