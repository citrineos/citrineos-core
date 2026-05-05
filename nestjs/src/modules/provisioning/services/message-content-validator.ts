// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Mirrors `validateMessageContent` / `validateMessageContentType` from
 * legacy `core/src/util/util/validator.ts`. The wire payload of
 * `MessageContentType` carries `format` (ASCII / HTML / URI / UTF8),
 * `content`, and an optional RFC-5646 `language` tag. JSON Schema gates
 * required fields; this module gates the format/content invariants
 * legacy enforces in the handler body (NotifyDisplayMessages,
 * SetDisplayMessage).
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface MessageContentLike {
  format: string;
  content: string;
  language?: string | null;
}

/** Printable ASCII only (space → tilde, char codes 0x20–0x7E). */
function validateASCIIContent(content: string): boolean {
  if (!content) return true;
  return /^[\x20-\x7E]*$/.test(content);
}

/**
 * Light HTML balance check. Walks tag positions; opening and closing
 * tags must nest and pair. Self-closing and HTML5 void elements skip
 * the stack push. No content → invalid (legacy returns `false` for
 * "no tags found"; we keep that behavior since the format claims HTML).
 */
function validateHTMLContent(content: string): boolean {
  if (!content) return true;
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const stack: string[] = [];
  let hasTags = false;
  const voidElements = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ]);
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(content)) !== null) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    hasTags = true;
    if (tag.endsWith('/>') || voidElements.has(tagName)) continue;
    if (tag.startsWith('</')) {
      if (stack.length === 0 || stack[stack.length - 1] !== tagName) return false;
      stack.pop();
    } else {
      stack.push(tagName);
    }
  }
  if (!hasTags) return false;
  return stack.length === 0;
}

/**
 * URI: try `new URL(content)`; if that fails, fall back to a permissive
 * relative-URI regex. Empty string is invalid (a `format=URI` payload
 * with no content is meaningless).
 */
function validateURIContent(content: string): boolean {
  if (!content) return false;
  try {
    new URL(content);
    return true;
  } catch {
    const uriPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:|^\/|^[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]+$/;
    return uriPattern.test(content);
  }
}

/**
 * UTF-8 surrogate-pair sanity. JS strings are UTF-16; this catches
 * unpaired high/low surrogates which would round-trip badly through
 * UTF-8.
 */
function validateUTF8Content(content: string): boolean {
  if (!content) return true;
  for (let i = 0; i < content.length; i++) {
    const c = content.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      if (i + 1 >= content.length) return false;
      const next = content.charCodeAt(i + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      i++;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      return false;
    }
  }
  return true;
}

/** RFC-5646 language tag. Same expression legacy uses. */
const RFC5646 =
  /^((?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?:([A-Za-z]{2,3}(-(?:[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?:[A-Za-z]{4}))?(-(?:[A-Za-z]{2}|[0-9]{3}))?(-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?:[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?:x(-[A-Za-z0-9]{1,8})+))?)|(?:x(-[A-Za-z0-9]{1,8})+))$/;

function validateLanguageTag(tag: string): boolean {
  if (!tag.trim()) return false;
  return RFC5646.test(tag);
}

function validateContentByFormat(format: string, content: string): ValidationResult {
  switch (format) {
    case 'ASCII':
      return validateASCIIContent(content)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage:
              'ASCII format requires content to contain only printable ASCII characters (space through tilde)',
          };
    case 'HTML':
      return validateHTMLContent(content)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'HTML format requires properly matched opening and closing tags',
          };
    case 'URI':
      return validateURIContent(content)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage: 'URI format requires a valid URI that the Charging Station can download',
          };
    case 'UTF8':
      return validateUTF8Content(content)
        ? { isValid: true }
        : {
            isValid: false,
            errorMessage:
              'UTF8 format requires valid UTF-8 encoded content without unpaired surrogate characters',
          };
    default:
      return { isValid: false, errorMessage: `Unknown message format: ${format}` };
  }
}

/**
 * Validate a complete `MessageContentType` — language tag (when set)
 * + format/content. Mirrors `validateMessageContentType` in legacy.
 */
export function validateMessageContentType(content: MessageContentLike): ValidationResult {
  if (content.language != null && !validateLanguageTag(content.language)) {
    return {
      isValid: false,
      errorMessage: `Invalid language tag: ${content.language}. Must be an RFC-5646 language tag (e.g., "en-US")`,
    };
  }
  return validateContentByFormat(content.format, content.content);
}
