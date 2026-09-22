// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LogRedactionConfig } from '@citrineos/types';
import { type ILogObj, type ISettingsParam, Logger } from 'tslog';

/**
 * The keys masked by a logger built without config to tell it otherwise.
 *
 * This is a floor, not the setting to reach for: `logRedaction.keys` is what a deployment
 * configures, and it defaults to this. The floor exists because a logger is sometimes built where
 * no config has been loaded — see {@link childLogger} — and tslog v5 masks nothing by default, so
 * without it those loggers would mask nothing at all.
 */
export const MASKED_LOG_KEYS: readonly string[] = ['password'];

/** tslog's own default, repeated here so a config-less logger and a configured one agree. */
const DEFAULT_PLACEHOLDER = '[***]';

/**
 * Translate {@link LogRedactionConfig} into tslog's `mask` group.
 *
 * Returned fresh per call so no two loggers share a settings object, and case-insensitively so a
 * configured `password` also covers `Password`. `patterns` are compiled here rather than in the
 * schema so the config stays serializable; they are anchored global because a non-global regex
 * would censor only the first match in a string and silently leave the rest.
 */
function maskSettings(redaction?: LogRedactionConfig) {
  return {
    keys: [...(redaction?.keys ?? MASKED_LOG_KEYS)],
    caseInsensitive: true,
    paths: [...(redaction?.paths ?? [])],
    regex: (redaction?.patterns ?? []).map((source) => new RegExp(source, 'g')),
    placeholder: redaction?.placeholder ?? DEFAULT_PLACEHOLDER,
  };
}

/**
 * The settings a root logger shares. Spread it into the per-logger settings so the caller keeps
 * control of `name`, `minLevel`, and `type`:
 *
 * ```ts
 * new Logger<ILogObj>({
 *   ...loggerDefaults(config.env, config.logRedaction),
 *   name: 'CitrineOS Logger',
 * });
 * ```
 *
 * Note that this covers what can be configured declaratively. Redaction that depends on the shape
 * of a logged object — an OCPP key code, say — is a `middleware` entry instead; see
 * `redactionMiddleware`.
 *
 * @param env - the deployment environment; `'production'` skips code-position capture.
 * @param redaction - what to strip from logs. Omitted, only {@link MASKED_LOG_KEYS} is masked.
 */
export function loggerDefaults(
  env: string,
  redaction?: LogRedactionConfig,
): ISettingsParam<ILogObj> {
  return {
    mask: maskSettings(redaction),
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
 * @param parent - the injected logger, if there is one. Its settings — the mask and any redaction
 *   middleware included — are inherited by the child.
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
