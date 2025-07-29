/**
 * CitrineOS Migration Status Checker
 *
 * Utility to check current migration status and validate schema
 */

import { Sequelize } from 'sequelize';

interface MigrationStatus {
  isV18Ready: boolean;
  appliedMigrations: string[];
  pendingMigrations: string[];
  tenantSupport: boolean;
  authorizationFlattened: boolean;
  asyncJobSupport: boolean;
  recommendations: string[];
}

class MigrationStatusChecker {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = new Sequelize(
      process.env.CITRINEOS_DATA_DB_NAME || 'citrine',
      process.env.CITRINEOS_DATA_DB_USERNAME || 'citrine',
      process.env.CITRINEOS_DATA_DB_PASSWORD || '',
      {
        host: process.env.CITRINEOS_DATA_DB_HOST || 'localhost',
        port: parseInt(process.env.CITRINEOS_DATA_DB_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
      },
    );
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const [results] = await this.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        )`,
      );
      return (results as { exists: boolean }[])[0].exists;
    } catch {
      return false;
    }
  }

  private async checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      const [results] = await this.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
          AND column_name = '${columnName}'
        )`,
      );
      return (results as { exists: boolean }[])[0].exists;
    } catch {
      return false;
    }
  }

  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const [results] = await this.sequelize.query(
        'SELECT name FROM "SequelizeMeta" ORDER BY name',
      );
      return (results as { name: string }[]).map((r) => r.name);
    } catch {
      return [];
    }
  }

  private async checkTenantSupport(): Promise<boolean> {
    const tenantsExists = await this.checkTableExists('Tenants');
    const authHasTenant = await this.checkColumnExists('Authorizations', 'tenantId');
    const stationsHasTenant = await this.checkColumnExists('ChargingStations', 'tenantId');

    return tenantsExists && authHasTenant && stationsHasTenant;
  }

  private async checkAuthorizationFlattened(): Promise<boolean> {
    const hasIdToken = await this.checkColumnExists('Authorizations', 'idToken');
    const hasType = await this.checkColumnExists('Authorizations', 'type');
    const hasStatus = await this.checkColumnExists('Authorizations', 'status');
    const hasConcurrentTransaction = await this.checkColumnExists(
      'Authorizations',
      'concurrentTransaction',
    );

    return hasIdToken && hasType && hasStatus && hasConcurrentTransaction;
  }

  private async checkAsyncJobSupport(): Promise<boolean> {
    return await this.checkTableExists('AsyncJobStatuses');
  }

  async getStatus(): Promise<MigrationStatus> {
    const appliedMigrations = await this.getAppliedMigrations();
    const tenantSupport = await this.checkTenantSupport();
    const authorizationFlattened = await this.checkAuthorizationFlattened();
    const asyncJobSupport = await this.checkAsyncJobSupport();

    const v18Migrations = [
      'v1.8.0-consolidated',
      '20250430105500-create-tenants-table',
      '20250621120000-flatten-authorization',
      '20250715000000-create-async-job-status',
    ];

    const hasV18Migration = v18Migrations.some((migration) =>
      appliedMigrations.includes(migration),
    );

    const isV18Ready = tenantSupport && authorizationFlattened && asyncJobSupport;

    const recommendations: string[] = [];

    if (!isV18Ready) {
      if (!hasV18Migration) {
        recommendations.push('Run v1.8.0 migration: npm run migrate:consolidated');
      }

      if (!tenantSupport) {
        recommendations.push('Missing tenant support - check Tenants table and tenantId columns');
      }

      if (!authorizationFlattened) {
        recommendations.push('Authorization schema not flattened - run authorization migration');
      }

      if (!asyncJobSupport) {
        recommendations.push('Missing async job support - check AsyncJobStatuses table');
      }
    }

    return {
      isV18Ready,
      appliedMigrations,
      pendingMigrations: [], // Would need migration-config.json to determine
      tenantSupport,
      authorizationFlattened,
      asyncJobSupport,
      recommendations,
    };
  }

  async generateReport(): Promise<void> {
    console.log('🔍 CitrineOS Migration Status Report');
    console.log('='.repeat(50));

    const status = await this.getStatus();

    console.log(
      `\n📊 Overall Status: ${status.isV18Ready ? '✅ v1.8.0 Ready' : '⚠️  Migration Required'}`,
    );

    console.log('\n🗃️  Feature Status:');
    console.log(`   Multi-tenant support: ${status.tenantSupport ? '✅' : '❌'}`);
    console.log(`   Authorization flattened: ${status.authorizationFlattened ? '✅' : '❌'}`);
    console.log(`   Async job support: ${status.asyncJobSupport ? '✅' : '❌'}`);

    console.log(`\n📋 Applied Migrations (${status.appliedMigrations.length}):`);
    if (status.appliedMigrations.length === 0) {
      console.log('   No migrations applied');
    } else {
      status.appliedMigrations.forEach((migration) => {
        console.log(`   ✅ ${migration}`);
      });
    }

    if (status.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      status.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n📝 Available Commands:');
    console.log('   npm run migrate:consolidated          # Run consolidated migrations');
    console.log('   npm run migrate:consolidated:status   # Check migration status');
    console.log('   npm run migrate                       # Run individual migrations');
    console.log('   npm run migrate:manager report        # Generate detailed report');
  }

  async close(): Promise<void> {
    await this.sequelize.close();
  }
}

// CLI interface
async function main() {
  const checker = new MigrationStatusChecker();

  try {
    await checker.generateReport();
  } catch (error) {
    console.error(
      '❌ Error checking migration status:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    await checker.close();
  }
}

if (require.main === module) {
  void main();
}

export { MigrationStatusChecker };
