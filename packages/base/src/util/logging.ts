// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ILogObj, type ISettingsParam, Logger } from 'tslog';

/**
 * Keys whose values are replaced with the mask placeholder wherever they appear in a logged object.
 *
 * Add a key here rather than at a call site: every logger built through {@link childLogger} or
 * {@link loggerDefaults} inherits the list, and so does every sub-logger below one.
 */
export const MASKED_LOG_KEYS: readonly string[] = ['password'];

const maskSettings = () => ({ keys: [...MASKED_LOG_KEYS] });

/**
 * The settings a root logger shares. Spread it into the per-logger settings so the caller keeps
 * control of `name`, `minLevel`, and `type`:
 *
 * ```ts
 * new Logger<ILogObj>({ ...loggerDefaults(config.env), name: 'CitrineOS Logger' });
 * ```
 *
 * @param env - the deployment environment; `'production'` skips code-position capture.
 */
export function loggerDefaults(env: string): ISettingsParam<ILogObj> {
  return {
    mask: maskSettings(),
    // Resolving a log's file and line means capturing and parsing a stack on every call. Outside
    // production that is worth paying for; in production it is overhead nobody reads. (This is what
    // v4's `hideLogPositionForProduction` did; 'auto' is v5's default for pretty output.)
    stack: { capture: env === 'production' ? 'off' : 'auto' },
  };
}

/**
 * The logger a collaborator should use: a named child of the one it was given, or — when it was
 * given none — a standalone logger that still masks.
 *
 * Nearly everything in CitrineOS takes an optional `Logger` and needs exactly this. Going through
 * here rather than building the fallback inline is what keeps {@link MASKED_LOG_KEYS} applied to it:
 * a bare `new Logger()` masks nothing under tslog v5.
 *
 * ```ts
 * this._logger = childLogger(logger, this.constructor.name);
 * ```
 *
 * @param parent - the injected logger, if there is one. Its settings, including the mask, are
 *   inherited by the child.
 * @param name - the child's name, conventionally `this.constructor.name`.
 * @param fallbackSettings - extra settings for the parentless case, for the few callers that have
 *   the config needed to set `minLevel` or {@link loggerDefaults}. Called only when there is no
 *   parent, so a caller whose config is not yet assigned can still pass one: constructors here
 *   commonly build their logger before their fields are set.
 */
export function childLogger(
  parent: Logger<ILogObj> | undefined,
  name: string,
  fallbackSettings?: () => ISettingsParam<ILogObj>,
): Logger<ILogObj> {
  return parent
    ? parent.getSubLogger({ name })
    : new Logger<ILogObj>({ mask: maskSettings(), ...fallbackSettings?.(), name });
}
