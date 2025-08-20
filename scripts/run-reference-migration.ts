/**
 * CitrineOS Reference Migration Runner
 *
 * Script to run version-specific reference migrations
 */

import { Sequelize } from 'sequelize';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

class ReferenceMigrationRunner {
  private sequelize: Sequelize;
  private versionsDir: string;

  constructor() {
    // Database connection setup
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.sequelize = new Sequelize(databaseUrl, {
      logging: (msg) => console.log(`[DB] ${msg}`),
    });

    this.versionsDir = join(process.cwd(), 'migrations', 'versions');
  }

  /**
   * Run a specific reference migration
   */
  async runReferenceMigration(version: string): Promise<void> {
    const migrationFile = join(this.versionsDir, `${version}-reference.ts`);

    if (!existsSync(migrationFile)) {
      throw new Error(`Reference migration file not found: ${migrationFile}`);
    }

    console.log(`🚀 Running reference migration for ${version}...`);
    console.log(`📁 Migration file: ${migrationFile}`);

    try {
      // Import and run the migration
      const migration = await import(migrationFile);

      console.log(`⚡ Executing ${version} reference migration...`);
      await migration.up(this.sequelize.getQueryInterface());

      console.log(`✅ Reference migration ${version} completed successfully!`);
      console.log(`📋 This migration executed all individual migrations for ${version}`);
    } catch (error) {
      console.error(`❌ Reference migration ${version} failed:`, error);
      throw error;
    }
  }

  /**
   * List available reference migrations
   */
  async listReferenceMigrations(): Promise<void> {
    if (!existsSync(this.versionsDir)) {
      console.log('📂 No versions directory found');
      return;
    }

    const files = await readdir(this.versionsDir);
    const referenceMigrations = files.filter((f) => f.endsWith('-reference.ts'));

    if (referenceMigrations.length === 0) {
      console.log('📄 No reference migrations found');
      return;
    }

    console.log('📋 Available reference migrations:');
    referenceMigrations.forEach((file) => {
      const version = file.replace('-reference.ts', '');
      console.log(`   • ${version}`);
    });
  }

  /**
   * Show help information
   */
  showHelp(): void {
    console.log(`
🔧 CitrineOS Reference Migration Runner

Usage:
  npm run migrate:reference <command> [version]

Commands:
  run <version>     Run a specific reference migration (e.g., v1.8.0)
  list              List all available reference migrations
  help              Show this help message

Examples:
  npm run migrate:reference run v1.8.0
  npm run migrate:reference list
  npm run migrate:reference help

Environment Variables:
  DATABASE_URL      Database connection string (required)
`);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.sequelize.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const runner = new ReferenceMigrationRunner();

  try {
    switch (command) {
      case 'run': {
        const version = args[1];
        if (!version) {
          console.error('❌ Please specify a version to run');
          console.log('💡 Example: npm run migrate:reference run v1.8.0');
          process.exit(1);
        }
        await runner.runReferenceMigration(version);
        break;
      }
      case 'list':
        await runner.listReferenceMigrations();
        break;
      case 'help':
      default:
        runner.showHelp();
        break;
    }
  } catch (error) {
    console.error('💥 Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  void main();
}

export { ReferenceMigrationRunner };
