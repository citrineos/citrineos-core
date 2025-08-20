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
   * Extract the 'up' logic from migration files and consolidate them
   */
  private extractUpMigrationLogic(migrations: MigrationInfo[]): string {
    let consolidatedLogic = '';

    for (const migration of migrations) {
      // Extract all components including constants for this migration
      const extracted = this.extractMigrationComponents(migration.content);

      // Add constants for this specific migration
      if (extracted.constants) {
        consolidatedLogic += `
      // Constants for ${migration.filename}
      ${extracted.constants}
`;
      }

      // Add the up method logic
      if (extracted.upLogic) {
        consolidatedLogic += `
      // From ${migration.filename}: ${migration.description}
      console.log('Applying migration: ${migration.filename}');
      ${extracted.upLogic}
`;
      }
    }

    return consolidatedLogic || '      // No migration logic found to consolidate';
  }

  /**
   * Extract the 'down' logic from migration files and consolidate them
   */
  private extractDownMigrationLogic(migrations: MigrationInfo[]): string {
    let consolidatedLogic = '';

    for (const migration of migrations) {
      // Extract all components including constants for this migration
      const extracted = this.extractMigrationComponents(migration.content);

      // Add constants for this specific migration
      if (extracted.constants) {
        consolidatedLogic += `
      // Constants for ${migration.filename}
      ${extracted.constants}
`;
      }

      // Add the down method logic
      if (extracted.downLogic) {
        consolidatedLogic += `
      // Reverting ${migration.filename}: ${migration.description}
      console.log('Reverting migration: ${migration.filename}');
      ${extracted.downLogic}
`;
      }
    }

    return consolidatedLogic || '      // No rollback logic found to consolidate';
  }

  /**
   * Extract all components from a migration file (imports, constants, up/down logic)
   */
  private extractMigrationComponents(content: string): {
    imports: string[];
    constants: string;
    upLogic: string | null;
    downLogic: string | null;
  } {
    const imports: string[] = [];
    let constants = '';

    // Extract imports
    const importMatches = content.match(/^import\s+.*?;$/gm);
    if (importMatches) {
      imports.push(...importMatches);
    }

    // Extract constants, variables, and other declarations before the export
    const beforeExportMatch = content.match(/^'use strict';?\s*([\s\S]*?)(?=export\s*=)/m);
    if (beforeExportMatch && beforeExportMatch[1]) {
      let beforeExport = beforeExportMatch[1].trim();

      // Remove imports since we handle them separately
      beforeExport = beforeExport.replace(/^import\s+.*?;$/gm, '').trim();

      // Remove empty lines and comments
      const lines = beforeExport.split('\n').filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('*')
        );
      });

      if (lines.length > 0) {
        constants = lines.join('\n      ');
      }
    }

    // Extract up and down method logic
    const upLogic = this.extractMigrationMethod(content, 'up');
    const downLogic = this.extractMigrationMethod(content, 'down');

    return {
      imports,
      constants,
      upLogic,
      downLogic,
    };
  }

  /**
   * Smart import consolidation that merges imports from the same package
   */
  private consolidateImports(imports: string[]): string[] {
    const importMap = new Map<string, { named: Set<string>; default: string | null }>();

    for (const importStatement of imports) {
      // Parse import statement to extract package and imports
      const match = importStatement.match(/^import\s+(.*?)\s+from\s+['"]([^'"]+)['"];?$/);
      if (match) {
        const [, importClause, packageName] = match;

        if (!importMap.has(packageName)) {
          importMap.set(packageName, { named: new Set(), default: null });
        }

        const packageImports = importMap.get(packageName)!;

        // Extract individual imports from the clause
        if (importClause.trim().startsWith('{') && importClause.trim().endsWith('}')) {
          // Named imports: { QueryInterface, DataTypes }
          const namedImports = importClause
            .trim()
            .slice(1, -1) // Remove { }
            .split(',')
            .map((imp) => imp.trim())
            .filter((imp) => imp);

          namedImports.forEach((imp) => packageImports.named.add(imp));
        } else {
          // Default import
          packageImports.default = importClause.trim();
        }
      }
    }

    // Generate consolidated import statements
    const consolidatedImports: string[] = [];
    for (const [packageName, { named, default: defaultImport }] of importMap.entries()) {
      const namedArray = Array.from(named).sort();

      if (defaultImport && namedArray.length > 0) {
        // Mix of default and named imports
        consolidatedImports.push(
          `import ${defaultImport}, { ${namedArray.join(', ')} } from '${packageName}';`,
        );
      } else if (defaultImport) {
        // Only default import
        consolidatedImports.push(`import ${defaultImport} from '${packageName}';`);
      } else if (namedArray.length > 0) {
        // Only named imports
        consolidatedImports.push(`import { ${namedArray.join(', ')} } from '${packageName}';`);
      }
    }

    return consolidatedImports.sort();
  }

  /**
   * Smart constant consolidation that removes duplicates and conflicts
   */
  private consolidateConstants(constantsArray: { filename: string; constants: string }[]): string {
    const constantMap = new Map<string, { value: string; files: string[] }>();

    for (const { filename, constants } of constantsArray) {
      if (!constants) continue;

      // Parse the entire constants block to handle multi-line declarations
      this.parseConstantsBlock(constants, filename, constantMap);
    }

    // Generate consolidated constants
    const consolidatedConstants: string[] = [];
    for (const [, { value }] of constantMap.entries()) {
      consolidatedConstants.push(value);
    }

    return consolidatedConstants.length > 0 ? consolidatedConstants.join('\n\n') : '';
  }

  /**
   * Parse a constants block and extract all constant declarations
   */
  private parseConstantsBlock(
    content: string,
    filename: string,
    constantMap: Map<string, { value: string; files: string[] }>,
  ): void {
    const lines = content.split('\n');
    let currentConstant = '';
    let currentVarName = '';
    let inConstantDeclaration = false;
    let bracketCount = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        if (inConstantDeclaration) {
          currentConstant += line + '\n';
        }
        continue;
      }

      // Start of a new constant declaration
      const constMatch = trimmed.match(/^const\s+([A-Z_][A-Z0-9_]*)\s*=\s*(.*)/);
      if (constMatch) {
        // Finish previous constant if any
        if (inConstantDeclaration && currentVarName) {
          this.addConstantToMap(currentVarName, currentConstant.trim(), filename, constantMap);
        }

        const [, varName, restOfDeclaration] = constMatch;
        currentVarName = varName;
        currentConstant = line + '\n';
        inConstantDeclaration = true;
        bracketCount = 0;
        braceCount = 0;

        // Count brackets and braces in the first line
        for (const char of restOfDeclaration) {
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        // Check if this is a single-line constant
        if (restOfDeclaration.includes(';') && bracketCount === 0 && braceCount === 0) {
          this.addConstantToMap(currentVarName, currentConstant.trim(), filename, constantMap);
          inConstantDeclaration = false;
          currentConstant = '';
          currentVarName = '';
        }
      } else if (inConstantDeclaration) {
        // Continue building the current constant
        currentConstant += line + '\n';

        // Count brackets and braces
        for (const char of trimmed) {
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }

        // Check if we've reached the end of the constant
        if (
          bracketCount === 0 &&
          braceCount === 0 &&
          (trimmed.endsWith('];') || trimmed.endsWith('},'))
        ) {
          this.addConstantToMap(currentVarName, currentConstant.trim(), filename, constantMap);
          inConstantDeclaration = false;
          currentConstant = '';
          currentVarName = '';
        }
      }
    }

    // Handle any remaining constant
    if (inConstantDeclaration && currentVarName) {
      this.addConstantToMap(currentVarName, currentConstant.trim(), filename, constantMap);
    }
  }

  /**
   * Add a constant to the map, handling duplicates and conflicts
   */
  private addConstantToMap(
    varName: string,
    value: string,
    filename: string,
    constantMap: Map<string, { value: string; files: string[] }>,
  ): void {
    if (constantMap.has(varName)) {
      const existing = constantMap.get(varName)!;
      // Normalize values for comparison (remove extra whitespace)
      const normalizedExisting = existing.value.replace(/\s+/g, ' ').trim();
      const normalizedNew = value.replace(/\s+/g, ' ').trim();

      if (normalizedExisting !== normalizedNew) {
        existing.files.push(filename);
        console.warn(
          `⚠️  Constant '${varName}' has different values in different files: ${existing.files.join(', ')}`,
        );
        // Keep the first occurrence
      }
    } else {
      constantMap.set(varName, { value, files: [filename] });
    }
  }

  /**
   * Extract the logic from a specific method ('up' or 'down') in a migration file
   */
  private extractMigrationMethod(content: string, method: 'up' | 'down'): string | null {
    try {
      // Match the method and extract its body
      const methodRegex = new RegExp(
        `${method}:\\s*async\\s*\\([^)]*\\)\\s*=>\\s*{([\\s\\S]*?)(?=\\n\\s*},?\\s*(?:down|up):|\\n\\s*}\\s*;?\\s*$)`,
        'g',
      );

      const match = methodRegex.exec(content);
      if (match && match[1]) {
        let methodBody = match[1].trim();

        // Remove the outer transaction wrapper if it exists (we'll handle transactions in the consolidated migration)
        methodBody = this.removeTransactionWrapper(methodBody);

        // Clean up and format the extracted logic
        methodBody = this.formatExtractedLogic(methodBody);

        return methodBody;
      }

      return null;
    } catch (error) {
      console.warn(`Failed to extract ${method} method from migration content:`, error);
      return null;
    }
  }

  /**
   * Remove transaction wrapper from extracted migration logic since we handle transactions at the consolidated level
   */
  private removeTransactionWrapper(methodBody: string): string {
    // First, try to extract content between try/catch blocks if they exist
    const tryMatch = methodBody.match(/try\s*{\s*([\s\S]*?)\s*}\s*catch/);
    if (tryMatch && tryMatch[1]) {
      methodBody = tryMatch[1];
    }

    // Remove transaction creation and management lines
    let cleaned = methodBody
      .replace(
        /const\s+transaction\s*=\s*await\s+queryInterface\.sequelize\.transaction\(\);?\s*/g,
        '',
      )
      .replace(/await\s+transaction\.commit\(\);?\s*/g, '')
      .replace(/await\s+transaction\.rollback\(\);?\s*/g, '')
      .replace(/^\s*try\s*{\s*$/gm, '')
      .replace(/^\s*}\s*catch\s*\([^)]*\)\s*{[\s\S]*?}$/gm, '')
      .replace(/^\s*}\s*finally\s*{[\s\S]*?}$/gm, '')
      .replace(/^\s*console\.log\([^)]*\);\s*$/gm, '')
      .replace(/^\s*console\.error\([^)]*\);\s*$/gm, '');

    // Remove transaction parameters from queryInterface calls more precisely
    cleaned = cleaned.replace(/,\s*{\s*transaction[^}]*}/g, '');
    cleaned = cleaned.replace(/,\s*transaction\s*(?=[,)])/g, '');

    // Clean up multiple empty lines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

    return cleaned.trim();
  }

  /**
   * Format and clean up extracted migration logic while preserving original formatting
   */
  private formatExtractedLogic(logic: string): string {
    // Split into lines and process each line
    const lines = logic.split('\n');
    const processedLines: string[] = [];
    let inMultiLineComment = false;

    for (const line of lines) {
      const originalLine = line;
      const trimmedLine = line.trim();

      // Handle multi-line comments
      if (trimmedLine.includes('/*')) {
        inMultiLineComment = true;
      }
      if (trimmedLine.includes('*/')) {
        inMultiLineComment = false;
        continue;
      }
      if (inMultiLineComment) {
        continue;
      }

      // Skip single-line comments and empty lines, but preserve structure
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
        if (trimmedLine === '') {
          processedLines.push(''); // Preserve empty lines for readability
        }
        continue;
      }

      // Skip transaction-related lines that weren't caught earlier
      if (
        trimmedLine.includes('transaction') &&
        (trimmedLine.includes('commit') ||
          trimmedLine.includes('rollback') ||
          trimmedLine.includes('await transaction'))
      ) {
        continue;
      }

      // Skip try/catch blocks markers
      if (
        trimmedLine === 'try {' ||
        trimmedLine === '}' ||
        trimmedLine.startsWith('} catch') ||
        trimmedLine.startsWith('catch')
      ) {
        continue;
      }

      // Preserve the original indentation but ensure minimum base indentation
      if (trimmedLine) {
        // Calculate original indentation
        const originalIndent = originalLine.length - originalLine.trimStart().length;
        const baseIndent = '      '; // 6 spaces for base indentation in consolidated migration

        // Preserve relative indentation
        if (originalIndent > 0) {
          const relativeIndent = ' '.repeat(Math.max(0, originalIndent - 4)); // Adjust for extraction context
          processedLines.push(baseIndent + relativeIndent + trimmedLine);
        } else {
          processedLines.push(baseIndent + trimmedLine);
        }
      }
    }

    return processedLines.join('\n');
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

    // Ask user for migration mode preference
    console.log('\n🎯 Choose Migration Mode:\n');
    console.log('1. Consolidated - Copy all migration logic into batch file');
    console.log('2. Reference - Create batch file that imports and executes original migrations\n');

    const modeChoice = await this.promptUser('Choose mode (1 for Consolidated, 2 for Reference): ');
    const useReference = modeChoice === '2';

    // Ensure versions directory exists
    if (!existsSync(this.versionsDir)) {
      await mkdir(this.versionsDir, { recursive: true });
    }

    const consolidatedContent = useReference
      ? this.generateCustomReferenceMigration(
          batchName,
          description || 'Custom migration batch',
          selectedMigrations,
        )
      : this.generateCustomConsolidatedMigration(
          batchName,
          description || 'Custom migration batch',
          selectedMigrations,
        );

    const suffix = useReference ? 'reference' : 'consolidated';
    const outputFile = join(this.versionsDir, `${batchName}-${suffix}.ts`);

    await writeFile(outputFile, consolidatedContent, 'utf-8');
    const modeDescription = useReference ? 'reference' : 'consolidated';
    console.log(`\n✅ Custom ${modeDescription} batch migration created: ${outputFile}`);

    // Create metadata file
    const metadataFile = join(this.versionsDir, `${batchName}-metadata.json`);
    const metadata = {
      batchName,
      description,
      mode: useReference ? 'reference' : 'consolidated',
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

    if (useReference) {
      console.log(
        '\n📝 Note: Reference migration imports and executes the original migration files.',
      );
      console.log('Make sure the original migration files remain in their current locations.');
    }
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

    // Extract and consolidate only imports (constants will be placed per-migration)
    const allImports: string[] = [];

    for (const migration of migrations) {
      const extracted = this.extractMigrationComponents(migration.content);
      // Collect all imports
      allImports.push(...extracted.imports);
    }

    // Use smart consolidation for imports only
    const consolidatedImports = this.consolidateImports(allImports);

    const importsSection = consolidatedImports.join('\n');
    const upLogic = this.extractUpMigrationLogic(migrations);
    const downLogic = this.extractDownMigrationLogic(migrations.slice().reverse());

    return `'use strict';

${importsSection}

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

      ${upLogic}
      
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

      ${downLogic}

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

    // Extract and consolidate only imports (constants will be placed per-migration)
    const allImports: string[] = [];

    for (const migration of migrations) {
      const extracted = this.extractMigrationComponents(migration.content);
      // Collect all imports
      allImports.push(...extracted.imports);
    }

    // Use smart consolidation for imports only
    const consolidatedImports = this.consolidateImports(allImports);

    const importsSection = consolidatedImports.join('\n');
    const upLogic = this.extractUpMigrationLogic(migrations);
    const downLogic = this.extractDownMigrationLogic(migrations.slice().reverse());

    return `'use strict';

${importsSection}

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

      ${upLogic}
      
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

      ${downLogic}

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

    // Ask user for migration mode preference
    console.log('\n🎯 Choose Migration Mode:\n');
    console.log('1. Consolidated - Copy all migration logic into batch files (current behavior)');
    console.log('2. Reference - Create batch files that import and execute original migrations\n');

    const modeChoice = await this.promptUser('Choose mode (1 for Consolidated, 2 for Reference): ');
    const useReference = modeChoice === '2';

    // Ensure versions directory exists
    if (!existsSync(this.versionsDir)) {
      await mkdir(this.versionsDir, { recursive: true });
    }

    for (const [version, versionMigrations] of Array.from(versionGroups.entries())) {
      if (versionMigrations.length === 0) continue;

      const modeDescription = useReference ? 'reference' : 'consolidated';
      console.log(
        `Creating ${modeDescription} batch migration for ${version} (${versionMigrations.length} migrations)`,
      );

      const consolidatedContent = useReference
        ? this.generateReferenceMigration(version, versionMigrations)
        : this.generateConsolidatedMigration(version, versionMigrations);

      const suffix = useReference ? 'reference' : 'consolidated';
      const outputFile = join(this.versionsDir, `${version}-${suffix}.ts`);

      await writeFile(outputFile, consolidatedContent, 'utf-8');
      console.log(`Created: ${outputFile}`);
    }

    const modeDescription = useReference ? 'reference' : 'consolidated';
    console.log(`\n✅ All ${modeDescription} batch migrations created successfully!`);

    if (useReference) {
      console.log(
        '\n📝 Note: Reference migrations import and execute the original migration files.',
      );
      console.log('Make sure the original migration files remain in their current locations.');
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
   * Generate reference-based migration that imports and runs original migrations
   */
  private generateReferenceMigration(version: string, migrations: MigrationInfo[]): string {
    const migrationList = migrations.map((m) => `// - ${m.filename}`).join('\n');

    // Generate import statements for each migration
    const migrationImports = migrations
      .map((migration, index) => {
        const migrationName = `migration${index + 1}`;
        const relativePath = `../${migration.filename.replace('.ts', '')}`;
        // Check if migration uses 'export =' or 'module.exports =' (CommonJS) or 'export default' (ES modules)
        const usesExportEquals = migration.content.includes('export =');
        const usesModuleExports = migration.content.includes('module.exports =');

        if (usesExportEquals) {
          return `import ${migrationName} from '${relativePath}';`;
        } else if (usesModuleExports) {
          return `import ${migrationName} from '${relativePath}';`;
        } else {
          return `import * as ${migrationName} from '${relativePath}';`;
        }
      })
      .join('\n');

    // Generate migration execution calls
    const upCalls = migrations
      .map((migration, index) => {
        const migrationName = `migration${index + 1}`;
        return `
      // From ${migration.filename}: ${migration.description}
      console.log('Applying migration: ${migration.filename}');
      await ${migrationName}.up(queryInterface);`;
      })
      .join('\n');

    const downCalls = migrations
      .slice()
      .reverse()
      .map((migration, index) => {
        const migrationName = `migration${migrations.length - index}`;
        return `
      // Reverting ${migration.filename}: ${migration.description}
      console.log('Reverting migration: ${migration.filename}');
      await ${migrationName}.down(queryInterface);`;
      })
      .join('\n');

    return `'use strict';

import { QueryInterface } from 'sequelize';

${migrationImports}

/**
 * CitrineOS ${version} Reference Migration
 * 
 * This migration references and executes all database schema changes for ${version}:
${migrationList}
 * 
 * Note: This migration imports and executes the original migration files from their current locations.
 */

export = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting CitrineOS ${version} reference migration...');
      console.log('Executing ${migrations.length} individual migrations...');
${upCalls}
      
      await transaction.commit();
      console.log('CitrineOS ${version} reference migration completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('Reference migration failed, rolling back:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back CitrineOS ${version} reference migration...');
      console.log('Reverting ${migrations.length} individual migrations...');
${downCalls}

      await transaction.commit();
      console.log('CitrineOS ${version} reference migration rollback completed!');

    } catch (error) {
      await transaction.rollback();
      console.error('Reference migration rollback failed:', error);
      throw error;
    }
  },
};`;
  }

  /**
   * Generate reference-based custom migration
   */
  private generateCustomReferenceMigration(
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

    // Generate import statements for each migration
    const migrationImports = migrations
      .map((migration, index) => {
        const migrationName = `migration${index + 1}`;
        const relativePath = `../${migration.filename.replace('.ts', '')}`;
        // Check if migration uses 'export =' or 'module.exports =' (CommonJS) or 'export default' (ES modules)
        const usesExportEquals = migration.content.includes('export =');
        const usesModuleExports = migration.content.includes('module.exports =');

        if (usesExportEquals) {
          return `import ${migrationName} from '${relativePath}';`;
        } else if (usesModuleExports) {
          return `import ${migrationName} from '${relativePath}';`;
        } else {
          return `import * as ${migrationName} from '${relativePath}';`;
        }
      })
      .join('\n');

    // Generate migration execution calls
    const upCalls = migrations
      .map((migration, index) => {
        const migrationName = `migration${index + 1}`;
        return `
      // From ${migration.filename}: ${migration.description}
      console.log('Applying migration: ${migration.filename}');
      await ${migrationName}.up(queryInterface);`;
      })
      .join('\n');

    const downCalls = migrations
      .slice()
      .reverse()
      .map((migration, index) => {
        const migrationName = `migration${migrations.length - index}`;
        return `
      // Reverting ${migration.filename}: ${migration.description}
      console.log('Reverting migration: ${migration.filename}');
      await ${migrationName}.down(queryInterface);`;
      })
      .join('\n');

    return `'use strict';

import { QueryInterface } from 'sequelize';

${migrationImports}

/**
 * CitrineOS Custom Reference Batch: ${batchName}
 * 
 * Description: ${description}
 * Created: ${new Date().toISOString()}
 * Date Range: ${dateRange}
 * 
 * This custom batch references ${migrations.length} selected migrations:
${migrationList}
 * 
 * Note: This migration imports and executes the original migration files from their current locations.
 */

export = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting custom reference batch: ${batchName}...');
      console.log('Description: ${description}');
      console.log('Migrations included: ${migrations.length}');
${upCalls}
      
      await transaction.commit();
      console.log('Custom reference batch ${batchName} completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('Custom reference batch failed, rolling back:', error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back custom reference batch: ${batchName}...');
${downCalls}

      await transaction.commit();
      console.log('Custom reference batch ${batchName} rollback completed!');

    } catch (error) {
      await transaction.rollback();
      console.error('Custom reference batch rollback failed:', error);
      throw error;
    }
  },
};`;
  }
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
  batch         Create batched migrations for each version (consolidated or reference)
  select        Interactively select migrations to create custom batch (consolidated or reference)
  interactive   Preview migration selection without creating batch
  list          List migrations grouped by version  
  report        Generate migration summary report
  help          Show this help message

Examples:
  node migration-manager.js batch                    # Auto-batch by version with mode choice
  node migration-manager.js select                   # Choose specific migrations with mode choice
  node migration-manager.js interactive              # Preview selection
  node migration-manager.js list
  node migration-manager.js report

Migration Modes:
  • Consolidated: Copies all migration logic into batch files (self-contained)
  • Reference: Creates batch files that import and execute original migrations

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
