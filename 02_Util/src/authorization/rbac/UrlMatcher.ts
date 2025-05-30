/**
 * Utility for matching URLs against patterns
 */
export class UrlMatcher {
  /**
   * Check if a URL matches a pattern
   * Supports exact matches, wildcards, and path parameters
   *
   * @param url URL to check
   * @param pattern Pattern to match against
   * @returns True if URL matches pattern
   */
  public static match(url: string, pattern: string): boolean {
    // Handle exact matches
    if (url === pattern) {
      return true;
    }

    // Handle wildcard patterns
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -1);
      return url === basePattern || url.startsWith(basePattern);
    }

    // Handle path parameters (e.g., /users/:id)
    const patternSegments = pattern.split('/').filter(Boolean);
    const urlSegments = url.split('/').filter(Boolean);

    if (patternSegments.length !== urlSegments.length) {
      return false;
    }

    for (let i = 0; i < patternSegments.length; i++) {
      // Skip path parameters (starting with :)
      if (patternSegments[i].startsWith(':')) {
        continue;
      }
      if (patternSegments[i] !== urlSegments[i]) {
        return false;
      }
    }

    return true;
  }
}
