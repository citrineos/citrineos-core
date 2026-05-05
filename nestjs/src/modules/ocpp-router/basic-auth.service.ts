import { Inject, Injectable, Logger } from '@nestjs/common';
import { pbkdf2Sync } from 'crypto';
import { IncomingMessage } from 'http';
import { eq, and } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { components } from '@entities/component.entity';
import { variables } from '@entities/variable.entity';
import { variableAttributes } from '@entities/variable-attribute.entity';

/**
 * Verifies the `Authorization: Basic …` header on incoming WebSocket
 * upgrades against the per-station password recorded in the device
 * model (`AuthorizationKey` variable, PBKDF2-hashed via the legacy
 * `PBKDF2:{iterations}:{keyLen}:{digest}:{salt}:{hash}` format).
 * Used by the OCPP router's `verifyClient` hook for security profiles
 * 1+ (BasicAuth / BasicAuthTls).
 */
@Injectable()
export class BasicAuthService {
  private readonly logger = new Logger(BasicAuthService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  extractCredentials(req: IncomingMessage): { username: string; password: string } | null {
    const header = req.headers.authorization ?? '';
    if (!header.startsWith('Basic ')) return null;
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon === -1) return null;
    return { username: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
  }

  async verifyCredentials(tenantId: number, stationId: string, password: string): Promise<boolean> {
    const rows = await this.db
      .select({ value: variableAttributes.value })
      .from(variableAttributes)
      .innerJoin(components, eq(variableAttributes.componentId, components.id))
      .innerJoin(variables, eq(variableAttributes.variableId, variables.id))
      .where(
        and(
          eq(variableAttributes.stationId, stationId),
          eq(variableAttributes.type, 'Actual'),
          eq(variableAttributes.tenantId, tenantId),
          eq(components.name, 'SecurityCtrlr'),
          eq(variables.name, 'BasicAuthPassword'),
        ),
      )
      .limit(1);

    if (!rows.length || !rows[0].value) {
      this.logger.warn(`No BasicAuthPassword found for station ${stationId}`);
      return false;
    }
    return this.isPasswordMatch(rows[0].value, password);
  }

  // PBKDF2 stored format: PBKDF2:{iterations}:{keyLen}:{digest}:{salt}:{hash}
  private isPasswordMatch(storedValue: string, inputPassword: string): boolean {
    const parts = storedValue.split(':');
    if (parts.length !== 6 || parts[0] !== 'PBKDF2') return false;
    const [, iterations, keyLen, digest, salt, originalHash] = parts;
    const hash = pbkdf2Sync(
      inputPassword,
      salt,
      parseInt(iterations),
      parseInt(keyLen),
      digest,
    ).toString('hex');
    return hash === originalHash;
  }
}
