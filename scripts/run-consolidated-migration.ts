/**
 * CitrineOS Consolidated Migration Runner
 *
 * Script to run version-specific consolidated migrations
 */

import { Sequelize } from 'sequelize';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface MigrationConfig {
  versions: Record<
    string,
    {
      description: string;
      timestamp_range: { start: string; end: string };
      features: string[];
      migrations: string[];
      breaking_changes: string[];
      upgrade_notes: string[];
    }
  >;
}

class ConsolidatedMigrationRunner {
  private sequelize: Sequelize;
  private migrationsDir: string;
  private versionsDir: string;

  constructor() {
    // Initialize Sequelize connection using the same config as the main app
    this.sequelize = new Sequelize(
      process.env.CITRINEOS_DATA_DB_NAME || 'citrine',
      process.env.CITRINEOS_DATA_DB_USERNAME || 'citrine',
      process.env.CITRINEOS_DATA_DB_PASSWORD || '',
      {
        host: process.env.CITRINEOS_DATA_DB_HOST || 'localhost',
        port: parseInt(process.env.CITRINEOS_DATA_DB_PORT || '5432'),
        dialect: 'postgres',
        logging: console.log,
      },
    );

    this.migrationsDir = join(__dirname, '..', 'migrations');
    this.versionsDir = join(this.migrationsDir, 'versions');
  }

  private async loadMigrationConfig(): Promise<MigrationConfig> {
    const configPath = join(this.migrationsDir, 'migration-config.json');
    const configContent = await readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  }

  async createMigrationsTable(): Promise<void> {
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL,
        PRIMARY KEY (name),
        UNIQUE (name)
      );
    `);
  }

  async getMigratedVersions(): Promise<string[]> {
    try {
      const [results] = await this.sequelize.query(
        'SELECT name FROM "SequelizeMeta" WHERE name LIKE \'v%.%-consolidated\' ORDER BY name',
      );
      return (results as { name: string }[]).map((r) => r.name);
    } catch (_error) {
      // Table doesn't exist yet
      return [];
    }
  }

  private async markMigrationComplete(version: string): Promise<void> {
    await this.sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?)', {
      replacements: [`${version}-consolidated`],
    });
  }

  private async removeMigrationRecord(version: string): Promise<void> {
    await this.sequelize.query('DELETE FROM "SequelizeMeta" WHERE name = ?', {
      replacements: [`${version}-consolidated`],
    });
  }

  async runConsolidatedMigration(version: string): Promise<void> {
    const migrationFile = join(this.migrationsDir, `${version}-consolidated.ts`);

    if (!existsSync(migrationFile)) {
      throw new Error(`Consolidated migration file not found: ${migrationFile}`);
    }

    console.log(`Running consolidated migration for ${version}...`);

    // Import and run the migration
    const migration = await import(migrationFile);

    try {
      await migration.up(this.sequelize.getQueryInterface());
      await this.markMigrationComplete(version);
      console.log(`✅ Consolidated migration ${version} completed successfully`);
    } catch (error) {
      console.error(`❌ Consolidated migration ${version} failed:`, error);
      throw error;
    }
  }

  async rollbackConsolidatedMigration(version: string): Promise<void> {
    const migrationFile = join(this.migrationsDir, `${version}-consolidated.ts`);

    if (!existsSync(migrationFile)) {
      throw new Error(`Consolidated migration file not found: ${migrationFile}`);
    }

    console.log(`Rolling back consolidated migration for ${version}...`);

    // Import and run the rollback
    const migration = await import(migrationFile);

    try {
      await migration.down(this.sequelize.getQueryInterface());
      await this.removeMigrationRecord(version);
      console.log(`✅ Consolidated migration ${version} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Consolidated migration ${version} rollback failed:`, error);
      throw error;
    }
  }

  async runAllPendingMigrations(): Promise<void> {
    await this.createMigrationsTable();

    const config = await this.loadMigrationConfig();
    const migratedVersions = await this.getMigratedVersions();

    const versions = Object.keys(config.versions).sort();

    for (const version of versions) {
      if (!migratedVersions.includes(`${version}-consolidated`)) {
        console.log(`\n🚀 Running migration for version ${version}`);
        console.log(`Description: ${config.versions[version].description}`);
        console.log(`Features: ${config.versions[version].features.join(', ')}`);

        if (config.versions[version].breaking_changes.length > 0) {
          console.log(
            `⚠️  Breaking changes: ${config.versions[version].breaking_changes.join(', ')}`,
          );
        }

        await this.runConsolidatedMigration(`v${version}`);
      } else {
        console.log(`✅ Version ${version} already migrated`);
      }
    }
  }

  async rollbackToVersion(targetVersion: string): Promise<void> {
    await this.createMigrationsTable();

    const config = await this.loadMigrationConfig();
    const migratedVersions = await this.getMigratedVersions();

    const versions = Object.keys(config.versions).sort().reverse();

    for (const version of versions) {
      if (migratedVersions.includes(`v${version}-consolidated`)) {
        if (version === targetVersion) {
          break;
        }

        console.log(`\n⏪ Rolling back migration for version ${version}`);
        await this.rollbackConsolidatedMigration(`v${version}`);
      }
    }
  }

  /**
   * Run custom batch migration
   */
  async runCustomBatchMigration(batchName: string): Promise<void> {
    const migrationFile = join(this.versionsDir, `${batchName}-consolidated.ts`);
    const metadataFile = join(this.versionsDir, `${batchName}-metadata.json`);

    if (!existsSync(migrationFile)) {
      throw new Error(`Custom batch migration file not found: ${migrationFile}`);
    }

    // Load metadata if available
    let metadata = null;
    if (existsSync(metadataFile)) {
      const metadataContent = await readFile(metadataFile, 'utf-8');
      metadata = JSON.parse(metadataContent);
    }

    console.log(`\n🎯 Running custom batch migration: ${batchName}`);
    if (metadata) {
      console.log(`Description: ${metadata.description}`);
      console.log(`Created: ${metadata.createdAt}`);
      console.log(`Migrations included: ${metadata.migrations.length}`);
      metadata.migrations.forEach((m: any) => {
        console.log(`  • ${m.filename}: ${m.description}`);
      });
    }

    // Import and run the migration
    const migration = await import(migrationFile);

    try {
      await migration.up(this.sequelize.getQueryInterface());
      await this.markMigrationComplete(`custom-${batchName}`);
      console.log(`✅ Custom batch migration ${batchName} completed successfully`);
    } catch (error) {
      console.error(`❌ Custom batch migration ${batchName} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback custom batch migration
   */
  async rollbackCustomBatchMigration(batchName: string): Promise<void> {
    const migrationFile = join(this.versionsDir, `${batchName}-consolidated.ts`);

    if (!existsSync(migrationFile)) {
      throw new Error(`Custom batch migration file not found: ${migrationFile}`);
    }

    console.log(`\n⏪ Rolling back custom batch migration: ${batchName}`);

    // Import and run the rollback
    const migration = await import(migrationFile);

    try {
      await migration.down(this.sequelize.getQueryInterface());
      await this.removeMigrationRecord(`custom-${batchName}`);
      console.log(`✅ Custom batch migration ${batchName} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Custom batch migration ${batchName} rollback failed:`, error);
      throw error;
    }
  }

  /**
   * List available custom batch migrations
   */
  async listCustomBatchMigrations(): Promise<void> {
    if (!existsSync(this.versionsDir)) {
      console.log('📁 No custom batch migrations found (versions directory does not exist)');
      return;
    }

    const files = await readdir(this.versionsDir);
    const batchFiles = files.filter((f: string) => f.endsWith('-consolidated.ts'));

    if (batchFiles.length === 0) {
      console.log('📁 No custom batch migrations found');
      return;
    }

    console.log('\n📋 Available Custom Batch Migrations:\n');

    for (const file of batchFiles) {
      const batchName = file.replace('-consolidated.ts', '');
      const metadataFile = join(this.versionsDir, `${batchName}-metadata.json`);

      console.log(`🎯 ${batchName}`);

      if (existsSync(metadataFile)) {
        try {
          const metadataContent = await readFile(metadataFile, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          console.log(`   Description: ${metadata.description}`);
          console.log(`   Created: ${metadata.createdAt}`);
          console.log(`   Migrations: ${metadata.migrations.length} files`);
        } catch (_error) {
          console.log('   (Metadata not available)');
        }
      } else {
        console.log('   (No metadata available)');
      }
      console.log();
    }
  }

  async close(): Promise<void> {
    await this.sequelize.close();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const runner = new ConsolidatedMigrationRunner();

  try {
    switch (command) {
      case 'up':
        await runner.runAllPendingMigrations();
        break;
      case 'down': {
        const targetVersion = args[1];
        if (!targetVersion) {
          console.error('Please specify target version for rollback');
          process.exit(1);
        }
        await runner.rollbackToVersion(targetVersion);
        break;
      }
      case 'version': {
        const version = args[1];
        if (!version) {
          console.error('Please specify version to migrate to');
          process.exit(1);
        }
        await runner.runConsolidatedMigration(`v${version}`);
        break;
      }
      case 'custom': {
        const batchName = args[1];
        if (!batchName) {
          console.error('Please specify custom batch name');
          process.exit(1);
        }
        await runner.runCustomBatchMigration(batchName);
        break;
      }
      case 'custom:rollback': {
        const rollbackBatchName = args[1];
        if (!rollbackBatchName) {
          console.error('Please specify custom batch name to rollback');
          process.exit(1);
        }
        await runner.rollbackCustomBatchMigration(rollbackBatchName);
        break;
      }
      case 'custom:list':
        await runner.listCustomBatchMigrations();
        break;
      case 'status': {
        await runner.createMigrationsTable();
        const migratedVersions = await runner.getMigratedVersions();
        console.log('Migrated versions:', migratedVersions);
        break;
      }
      case 'help':
      default:
        console.log(`
CitrineOS Consolidated Migration Runner

Usage: node run-consolidated-migration.js <command> [options]

Standard Commands:
  up                    Run all pending migrations
  down <version>        Rollback to specified version
  version <version>     Run migration for specific version
  status               Show migration status

Custom Batch Commands:
  custom <batch-name>          Run custom batch migration
  custom:rollback <batch-name> Rollback custom batch migration
  custom:list                  List available custom batch migrations

Examples:
  # Standard operations
  node run-consolidated-migration.js up
  node run-consolidated-migration.js down 1.7.0
  node run-consolidated-migration.js version 1.8.0
  node run-consolidated-migration.js status

  # Custom batch operations
  node run-consolidated-migration.js custom my-hotfix
  node run-consolidated-migration.js custom:rollback my-hotfix
  node run-consolidated-migration.js custom:list

  # Creating custom batches (use migration manager)
  node scripts/migration-manager.js select
`);
        break;
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  void main();
}

export { ConsolidatedMigrationRunner };
