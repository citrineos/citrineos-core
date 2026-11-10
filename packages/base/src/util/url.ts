// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Removes the userinfo, query and fragment from a URL, for writing to a log.
 */
export function redactUrl(url: string): string {
  const queryStart = url.search(/[?#]/);
  const withoutQuery = queryStart === -1 ? url : url.slice(0, queryStart);

  // 'https://user:pw@receiver:8000/hook': scheme is 'https', authority is 'user:pw@receiver:8000'.
  const schemeEnd = withoutQuery.indexOf('://');
  const authorityStart = schemeEnd === -1 ? 0 : schemeEnd + 3;
  const pathStart = withoutQuery.indexOf('/', authorityStart);
  const authorityEnd = pathStart === -1 ? withoutQuery.length : pathStart;
  const userinfoEnd = withoutQuery.lastIndexOf('@', authorityEnd - 1);

  if (userinfoEnd < authorityStart) {
    // There is no user info
    return withoutQuery;
  }
  return withoutQuery.slice(0, authorityStart) + withoutQuery.slice(userinfoEnd + 1);
}
