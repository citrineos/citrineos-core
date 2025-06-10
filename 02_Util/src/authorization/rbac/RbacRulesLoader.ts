import * as fs from 'fs';
import { ILogObj, Logger } from 'tslog';
//TODO fix import
import { RbacRules, RbacRulesSchema } from '@citrineos/base/dist/config/types';
import { UrlMatcher } from './UrlMatcher';
import path from 'path';

/**
 * Class to load and validate RBAC rules
 */
export class RbacRulesLoader {
  private _rules: RbacRules = {};
  private readonly _logger: Logger<ILogObj>;

  /**
   * Creates a new RBAC rules loader
   *
   * @param rulesFilePath Path to the JSON rules file
   * @param logger Logger instance
   */
  constructor(rulesFilePath: string, logger: Logger<ILogObj>) {
    this._logger = logger.getSubLogger({ name: 'RbacRulesLoader' });
    this.loadRules(rulesFilePath);
  }

  /**
   * Load and validate rules from a JSON file
   *
   * @param filePath Path to the JSON rules file
   */
  private loadRules(filePath: string): void {
    const absoluteFilePath = path.join(process.cwd(), filePath);
    try {
      if (!fs.existsSync(absoluteFilePath)) {
        this._logger.warn(`Rules file not found at ${absoluteFilePath}, using empty rules`);
        return;
      }

      const rulesContent = fs.readFileSync(absoluteFilePath, 'utf8');
      const parsedRules = JSON.parse(rulesContent);

      // Validate rules against the schema
      const validationResult = RbacRulesSchema.safeParse(parsedRules);

      if (!validationResult.success) {
        this._logger.error('Invalid RBAC rules format:', validationResult.error);
        throw new Error('Invalid RBAC rules format');
      }

      // Store the validated rules
      this._rules = validationResult.data;

      this._logger.info(`Successfully loaded RBAC rules from ${filePath}`);
      this._logger.debug(`Loaded ${Object.keys(this._rules).length} tenants with rules`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid RBAC rules format') {
        throw error; // Re-throw validation errors
      }
      this._logger.error('Failed to load RBAC rules:', error);
      throw new Error(
        `Failed to load RBAC rules: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get the required roles for a specific tenant, URL, and HTTP method
   *
   * @param tenantId Tenant identifier
   * @param url URL path
   * @param method HTTP method
   * @returns Array of required roles or null if no matching rule
   */
  public getRequiredRoles(tenantId: string, url: string, method: string): string[] | null {
    // Normalize method to uppercase
    method = method.toUpperCase();
    const cleanUrl = this.normalizeUrl(url);
    const tenantRules = this._rules[tenantId];
    if (!tenantRules) {
      return null;
    }

    // Try exact URL match first
    const exactUrlRules = tenantRules[cleanUrl];
    if (exactUrlRules) {
      return exactUrlRules[method] || exactUrlRules['*'] || null;
    }

    // Pattern matching
    for (const pattern in tenantRules) {
      if (UrlMatcher.match(cleanUrl, pattern)) {
        const methodRules = tenantRules[pattern];
        const roles = methodRules[method] || methodRules['*'];
        if (roles) {
          return roles;
        }
      }
    }

    return null;
  }

  private normalizeUrl(url: string): string {
    // Remove query parameters and fragments
    let cleanUrl = url.split('?')[0].split('#')[0];

    // Remove trailing slash (optional, depends on your URL patterns)
    if (cleanUrl.length > 1 && cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    // Ensure it starts with /
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }

    return cleanUrl;
  }
}
