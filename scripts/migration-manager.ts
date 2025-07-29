/**
 * CitrineOS Migration Manager
 *
 * Utility for managing version-based migration batching.
 * Helps consolidate individual migrations into version-specific batches.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import * as readline from 'readline';

interface MigrationInfo {
  filename: string;
  timestamp: string;
  description: string;
  version?: string;
  content: string;
}

class MigrationManager {
  private migrationsDir: string;
  private versionsDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.migrationsDir = join(projectRoot, 'migrations');
    this.versionsDir = join(projectRoot, 'migrations', 'versions');
  }

  /**
   * Parse migration filename to extract info
   */
  private parseMigrationFilename(filename: string): { timestamp: string; description: string } {
    const match = filename.match(/^(\d{14})-(.+)\.ts$/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }
    return {
      timestamp: match[1],
      description: match[2],
    };
  }

  /**
   * Read all migration files and return parsed info
   */
  private async readMigrations(): Promise<MigrationInfo[]> {
    if (!existsSync(this.migrationsDir)) {
      throw new Error(`Migrations directory not found: ${this.migrationsDir}`);
    }

    const files = await readdir(this.migrationsDir);
    const migrationFiles = files.filter((f) => f.endsWith('.ts') && !f.startsWith('v'));

    const migrations: MigrationInfo[] = [];

    for (const filename of migrationFiles) {
      const { timestamp, description } = this.parseMigrationFilename(filename);
      const content = await readFile(join(this.migrationsDir, filename), 'utf-8');

      migrations.push({
        filename,
        timestamp,
        description,
        content,
      });
    }

    return migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Group migrations by version based on timestamp ranges
   */
  private groupMigrationsByVersion(migrations: MigrationInfo[]): Map<string, MigrationInfo[]> {
    const versionGroups = new Map<string, MigrationInfo[]>();

    // Define version boundaries based on timestamps
    const versionBoundaries = {
      'v1.8.0': { start: '20250430000000', end: '20250715999999' },
      // Add more versions as needed
    };

    for (const migration of migrations) {
      let assigned = false;

      for (const [version, { start, end }] of Object.entries(versionBoundaries)) {
        if (migration.timestamp >= start && migration.timestamp <= end) {
          if (!versionGroups.has(version)) {
            versionGroups.set(version, []);
          }
          versionGroups.get(version)!.push(migration);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        // Put unassigned migrations in 'unversioned' group
        if (!versionGroups.has('unversioned')) {
          versionGroups.set('unversioned', []);
        }
        versionGroups.get('unversioned')!.push(migration);
      }
    }

    return versionGroups;
  }

  /**
   * Interactive file selection for custom migration batches
   */
  private createReadlineInterface(): readline.Interface {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async promptUser(question: string): Promise<string> {
    const rl = this.createReadlineInterface();
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  /**
   * Allow user to interactively select migrations for batching
   */
  async selectMigrationsInteractively(): Promise<MigrationInfo[]> {
    const migrations = await this.readMigrations();
    const selected: MigrationInfo[] = [];

    console.log('\n📋 Available Migrations:\n');
    migrations.forEach((migration, index) => {
      console.log(`${index + 1}. ${migration.filename}`);
      console.log(`   Description: ${migration.description}`);
      console.log(`   Timestamp: ${migration.timestamp}\n`);
    });

    console.log('💡 Migration Selection Options:');
    console.log('   • Enter numbers separated by commas (e.g., 1,3,5)');
    console.log('   • Enter ranges with dashes (e.g., 1-5)');
    console.log('   • Mix both formats (e.g., 1,3-7,9)');
    console.log('   • Enter "all" to select all migrations');
    console.log('   • Enter "none" or empty to skip selection\n');

    const selection = await this.promptUser('Select migrations: ');

    if (selection.toLowerCase() === 'all') {
      return migrations;
    }

    if (selection.toLowerCase() === 'none' || selection === '') {
      return [];
    }

    // Parse selection
    const selectedIndices = this.parseSelection(selection, migrations.length);

    for (const index of selectedIndices) {
      if (index >= 0 && index < migrations.length) {
        selected.push(migrations[index]);
      }
    }

    if (selected.length === 0) {
      console.log('⚠️  No valid migrations selected.');
      return [];
    }

    console.log(`\n✅ Selected ${selected.length} migrations:`);
    selected.forEach((migration) => {
      console.log(`   • ${migration.filename}`);
    });

    const confirm = await this.promptUser('\nProceed with these selections? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Selection cancelled.');
      return [];
    }

    return selected;
  }

  /**
   * Parse user selection string into array of indices
   */
  private parseSelection(selection: string, maxLength: number): number[] {
    const indices: Set<number> = new Set();
    const parts = selection.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Range selection (e.g., "3-7")
        const [start, end] = part.split('-').map((n) => parseInt(n.trim()) - 1);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 0 && i < maxLength) {
              indices.add(i);
            }
          }
        }
      } else {
        // Single selection (e.g., "1")
        const index = parseInt(part) - 1;
        if (!isNaN(index) && index >= 0 && index < maxLength) {
          indices.add(index);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * Create custom batch migration with selected files
   */
  async createCustomBatchMigration(): Promise<void> {
    console.log('🎯 Custom Migration Batch Creator\n');

    const selectedMigrations = await this.selectMigrationsInteractively();

    if (selectedMigrations.length === 0) {
      console.log('No migrations selected. Exiting.');
      return;
    }

    const batchName = await this.promptUser(
      'Enter batch name (e.g., "custom-v1.8.0", "hotfix-auth"): ',
    );
    if (!batchName) {
      console.log('❌ Batch name is required. Exiting.');
      return;
    }

    const description = await this.promptUser('Enter batch description: ');

    // Ensure versions directory exists
    if (!existsSync(this.versionsDir)) {
      await mkdir(this.versionsDir, { recursive: true });
    }

    const consolidatedContent = this.generateCustomConsolidatedMigration(
      batchName,
      description || 'Custom migration batch',
      selectedMigrations,
    );

    const outputFile = join(this.versionsDir, `${batchName}-consolidated.ts`);

    await writeFile(outputFile, consolidatedContent, 'utf-8');
    console.log(`\n✅ Custom batch migration created: ${outputFile}`);

    // Create metadata file
    const metadataFile = join(this.versionsDir, `${batchName}-metadata.json`);
    const metadata = {
      batchName,
      description,
      createdAt: new Date().toISOString(),
      migrations: selectedMigrations.map((m) => ({
        filename: m.filename,
        description: m.description,
        timestamp: m.timestamp,
      })),
    };

    await writeFile(metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`📄 Metadata file created: ${metadataFile}`);

    console.log(`\n🚀 To run this custom batch migration:`);
    console.log(`   ts-node scripts/run-consolidated-migration.ts custom ${batchName}`);
  }

  /**
   * Generate consolidated migration for custom selection
   */
  private generateCustomConsolidatedMigration(
    batchName: string,
    description: string,
    migrations: MigrationInfo[],
  ): string {
    const migrationList = migrations
      .map((m) => `//   - ${m.filename}: ${m.description}`)
      .join('\n');
    const migrationTimestamps = migrations.map((m) => m.timestamp).sort();
    const dateRange =
      migrationTimestamps.length > 1
        ? `${migrationTimestamps[0]} to ${migrationTimestamps[migrationTimestamps.length - 1]}`
        : migrationTimestamps[0];

    return `'use strict';

import { QueryInterface } from 'sequelize';

/**
 * CitrineOS Custom Migration Batch: ${batchName}
 * 
 * Description: ${description}
 * Created: ${new Date().toISOString()}
 * Date Range: ${dateRange}
 * 
 * This custom batch includes ${migrations.length} selected migrations:
${migrationList}
 */

export = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting custom migration batch: ${batchName}...');
      console.log('Description: ${description}');
      console.log('Migrations included: ${migrations.length}');

      // TODO: Implement consolidated migration logic for selected migrations
      // Extract and combine the 'up' logic from the following files:
${migrations.map((m) => `      // - ${m.filename}`).join('\n')}
      
      // IMPORTANT: Implement the actual migration logic here
      // This is a template - you must add the actual database operations
      
      await transaction.commit();
      console.log('Custom migration batch ${batchName} completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('Custom migration batch failed, rolling back:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back custom migration batch: ${batchName}...');

      // TODO: Implement rollback logic for selected migrations (in reverse order)
      // Extract and combine the 'down' logic from the following files (in reverse):
${migrations
  .slice()
  .reverse()
  .map((m) => `      // - ${m.filename}`)
  .join('\n')}
      
      // IMPORTANT: Implement the actual rollback logic here
      // This is a template - you must add the actual database operations

      await transaction.commit();
      console.log('Custom migration batch ${batchName} rollback completed!');

    } catch (error) {
      await transaction.rollback();
      console.error('Custom migration batch rollback failed:', error);
      throw error;
    }
  },
};`;
  }

  private generateConsolidatedMigration(version: string, migrations: MigrationInfo[]): string {
    const migrationList = migrations.map((m) => `// - ${m.filename}`).join('\n');

    return `'use strict';

import { QueryInterface } from 'sequelize';

/**
 * CitrineOS ${version} Consolidated Migration
 * 
 * This migration consolidates all database schema changes for ${version}:
${migrationList}
 */

export = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting CitrineOS ${version} consolidated migration...');

      // TODO: Implement consolidated migration logic
      // Combine all individual migration 'up' logic here
      
      await transaction.commit();
      console.log('CitrineOS ${version} consolidated migration completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed, rolling back:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back CitrineOS ${version} consolidated migration...');

      // TODO: Implement consolidated rollback logic
      // Combine all individual migration 'down' logic here (in reverse order)

      await transaction.commit();
      console.log('CitrineOS ${version} consolidated migration rollback completed!');

    } catch (error) {
      await transaction.rollback();
      console.error('Migration rollback failed:', error);
      throw error;
    }
  },
};`;
  }

  /**
   * Create batch migrations for each version
   */
  async createBatchMigrations(): Promise<void> {
    const migrations = await this.readMigrations();
    const versionGroups = this.groupMigrationsByVersion(migrations);

    // Ensure versions directory exists
    if (!existsSync(this.versionsDir)) {
      await mkdir(this.versionsDir, { recursive: true });
    }

    for (const [version, versionMigrations] of Array.from(versionGroups.entries())) {
      if (versionMigrations.length === 0) continue;

      console.log(
        `Creating batch migration for ${version} (${versionMigrations.length} migrations)`,
      );

      const consolidatedContent = this.generateConsolidatedMigration(version, versionMigrations);
      const outputFile = join(this.versionsDir, `${version}-consolidated.ts`);

      await writeFile(outputFile, consolidatedContent, 'utf-8');
      console.log(`Created: ${outputFile}`);
    }
  }

  /**
   * List migrations grouped by version
   */
  async listMigrationsByVersion(): Promise<void> {
    const migrations = await this.readMigrations();
    const versionGroups = this.groupMigrationsByVersion(migrations);

    console.log('Migrations grouped by version:');
    console.log('='.repeat(50));

    for (const [version, versionMigrations] of Array.from(versionGroups.entries())) {
      console.log(`\n${version.toUpperCase()} (${versionMigrations.length} migrations):`);
      for (const migration of versionMigrations) {
        console.log(`  - ${migration.filename} : ${migration.description}`);
      }
    }
  }

  /**
   * Generate migration summary report
   */
  async generateReport(): Promise<void> {
    const migrations = await this.readMigrations();
    const versionGroups = this.groupMigrationsByVersion(migrations);

    const reportContent = `# CitrineOS Migration Report

Generated on: ${new Date().toISOString()}

## Migration Summary

${Array.from(versionGroups.entries())
  .map(
    ([version, migs]) => `
### ${version} (${migs.length} migrations)

${migs.map((m) => `- \`${m.filename}\`: ${m.description}`).join('\n')}
`,
  )
  .join('\n')}

## Recommendations

1. **Consolidate migrations by version**: Use the consolidated migration files instead of individual ones for new deployments
2. **Maintain compatibility**: Keep individual migrations for existing deployments that may have already applied some migrations
3. **Version-based deployment**: Use the version-specific batch migrations for clean deployments
`;

    const reportFile = join(dirname(this.migrationsDir), 'MIGRATION_REPORT.md');
    await writeFile(reportFile, reportContent, 'utf-8');
    console.log(`Migration report generated: ${reportFile}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const manager = new MigrationManager();

  try {
    switch (command) {
      case 'batch':
        await manager.createBatchMigrations();
        break;
      case 'list':
        await manager.listMigrationsByVersion();
        break;
      case 'report':
        await manager.generateReport();
        break;
      case 'select':
        await manager.createCustomBatchMigration();
        break;
      case 'interactive': {
        const selected = await manager.selectMigrationsInteractively();
        if (selected.length > 0) {
          console.log(
            `\n📋 You selected ${selected.length} migrations. Use 'select' command to create a batch.`,
          );
        }
        break;
      }
      case 'help':
      default:
        console.log(`
CitrineOS Migration Manager

Usage: node migration-manager.js <command>

Commands:
  batch         Create batched migrations for each version (automatic)
  select        Interactively select migrations to create custom batch
  interactive   Preview migration selection without creating batch
  list          List migrations grouped by version  
  report        Generate migration summary report
  help          Show this help message

Examples:
  node migration-manager.js batch                    # Auto-batch by version
  node migration-manager.js select                   # Choose specific migrations
  node migration-manager.js interactive              # Preview selection
  node migration-manager.js list
  node migration-manager.js report

Interactive Selection Syntax:
  • Single numbers: 1,3,5
  • Ranges: 1-5 or 3-7
  • Mixed: 1,3-7,9,12-15
  • All: "all"
  • None: "none" or empty
`);
        break;
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}

export { MigrationManager };
