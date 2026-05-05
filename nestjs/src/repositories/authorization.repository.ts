import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { authorizations, NewAuthorization } from '@entities/authorization.entity';

/**
 * Drizzle-backed repository for the Authorization entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class AuthorizationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByIdToken(tenantId: number, idToken: string, idTokenType: string) {
    return this.db.query.authorizations.findFirst({
      where: and(
        eq(authorizations.idToken, idToken),
        eq(authorizations.idTokenType, idTokenType),
        eq(authorizations.tenantId, tenantId),
      ),
    });
  }

  /** OCPP 1.6 has no idTokenType in the request — match on idToken alone. */
  async findByIdTokenAnyType(tenantId: number, idToken: string) {
    return this.db.query.authorizations.findFirst({
      where: and(eq(authorizations.idToken, idToken), eq(authorizations.tenantId, tenantId)),
    });
  }

  async upsert(data: NewAuthorization) {
    const [row] = await this.db
      .insert(authorizations)
      .values(data)
      .onConflictDoUpdate({
        target: [authorizations.idToken, authorizations.idTokenType, authorizations.tenantId],
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  }

  async findAll(tenantId: number) {
    return this.db.select().from(authorizations).where(eq(authorizations.tenantId, tenantId));
  }

  /**
   * Look up by primary key — used when resolving an
   * `Authorization.groupAuthorizationId` self-FK to render
   * `groupIdToken` / `parentIdTag` on the wire response.
   */
  async findById(tenantId: number, id: number) {
    return this.db.query.authorizations.findFirst({
      where: and(eq(authorizations.id, id), eq(authorizations.tenantId, tenantId)),
    });
  }
}
