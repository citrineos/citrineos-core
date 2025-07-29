# CitrineOS Migration Management System

This document describes the comprehensive migration management system for CitrineOS, designed to simplify database upgrades and provide flexible deployment options for schema changes across versions.

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Version 1.8.0 Features](#version-180-features)
4. [Usage](#usage)
5. [Interactive File Selection](#interactive-file-selection)
6. [Migration Strategy Decision Tree](#migration-strategy-decision-tree)
7. [Commands Reference](#commands-reference)
8. [Selection Syntax](#selection-syntax)
9. [Use Cases & Examples](#use-cases--examples)
10. [Generated File Structure](#generated-file-structure)
11. [Management Workflows](#management-workflows)
12. [Database Backup & Recovery](#database-backup--recovery)
13. [Version Configuration](#version-configuration)
14. [Breaking Changes in v1.8.0](#breaking-changes-in-v180)
15. [Performance Improvements](#performance-improvements)
16. [Troubleshooting](#troubleshooting)
17. [Best Practices](#best-practices)
18. [Advanced Scenarios](#advanced-scenarios)
19. [Future Versions](#future-versions)

## Overview

The migration system supports three approaches:

1. **Individual Migrations**: Traditional sequential migrations for existing installations
2. **Consolidated Migrations**: Version-based batch migrations for clean installations and major upgrades
3. **Custom Batch Migrations**: Interactive file selection for targeted deployments and hotfixes

### Key Benefits

- **Granular Control**: Pick exactly which migrations to include
- **Flexible Deployment**: Create deployment-specific migration sets
- **Emergency Response**: Quickly create hotfix migration batches
- **Safety**: Transaction-wrapped execution with rollback capabilities
- **Audit Trail**: Complete tracking of what was included in each batch

## Directory Structure

```
migrations/
├── migration-config.json          # Version configuration and metadata
├── v1.8.0-consolidated.ts         # Consolidated migration for v1.8.0
├── 20250430105500-create-tenants-table.ts        # Individual migrations (legacy)
├── 20250430110000-create-default-tenant.ts
├── 20250430130000-update-existing-tables-to-include-default-tenant.ts
├── 20250618150000-update-authorizations-to-include-concurrenttransaction.ts
├── 20250618150800-update-existing-authorization-to-include-realtimeauth.ts
├── 20250621120000-flatten-authorization.ts
├── 20250714120500-create-tenant-partner-table.ts
├── 20250714121000-alter-tenants-table-add-ocpi-fields.ts
├── 20250715000000-create-async-job-status.ts
└── versions/                      # Generated custom batch migrations
    ├── my-hotfix-consolidated.ts
    ├── my-hotfix-metadata.json
    ├── tenant-only-consolidated.ts
    └── tenant-only-metadata.json

scripts/
├── migration-manager.ts           # Utility for managing migrations
├── run-consolidated-migration.ts  # Runner for consolidated migrations
└── check-migration-status.ts      # Migration status checker
```

## Version 1.8.0 Features

The v1.8.0 consolidated migration includes:

### 🏢 Multi-Tenant Architecture

- **Tenants table**: Central tenant management with OCPI country/party codes
- **TenantPartners table**: Support for tenant partnerships and relationships
- **Automatic tenant assignment**: All existing data assigned to default tenant (ID: 1)
- **Tenant isolation**: Schema-level separation capabilities for scalability

### 🔐 Authorization Flattening

- **Performance optimization**: Flattened authorization structure eliminates complex JOINs
- **Direct column access**: Single table lookup instead of relational queries
- **Data migration**: Automatic migration from old IdTokens/IdTokenInfos structure
- **Backward compatibility**: Maintains data integrity during transition

### ⚡ Async Job Management

- **AsyncJobStatuses table**: Track long-running background operations
- **Job status monitoring**: Real-time status updates with progress tracking
- **OCPI integration**: Async token fetching support for large datasets
- **Failure handling**: Comprehensive error tracking and recovery

### 🔌 Enhanced OCPI Support

- **Country/Party codes**: Tenant-level OCPI identification
- **Partner management**: Multi-party OCPI relationships
- **Token synchronization**: Improved token management workflows
- **Background operations**: Async OCPI data fetching and synchronization

## Usage

### For New Installations

Use the consolidated migration for clean, fast setup:

```bash
# Run all consolidated migrations
npm run migrate:consolidated

# Run specific version
npm run migrate:version 1.8.0

# Check migration status
npm run migrate:consolidated:status
```

### For Existing Installations

Continue using individual migrations if you've already applied some:

```bash
# Run pending individual migrations
npm run migrate

# Or use sequelize-cli directly
npx sequelize-cli db:migrate

# Check what migrations are needed
npm run migrate:check
```

### Migration Management

```bash
# Generate migration report
npm run migrate:manager report

# List migrations by version
npm run migrate:manager list

# Create batch migrations for new versions
npm run migrate:manager batch
```

## Interactive File Selection

### 🎯 Overview

The interactive file selection feature allows you to:

- **Pick specific migrations** from available files
- **Create custom batches** with descriptive names
- **Mix migrations from different time periods**
- **Create targeted fixes** or feature-specific migrations
- **Maintain full control** over what gets included

### Quick Start

```bash
# Create custom batch with file selection
npm run migrate:select

# Preview available migrations without creating batch
npm run migrate:manager interactive

# List your custom batches
npm run migrate:custom:list

# Run a custom batch
npm run migrate:custom your-batch-name

# Rollback custom batch
npm run migrate:custom:rollback your-batch-name
```

### Step-by-Step Example

#### 1. Start Interactive Selection

```bash
$ npm run migrate:select

🎯 Custom Migration Batch Creator

📋 Available Migrations:

1. 20250430105500-create-tenants-table.ts
   Description: create-tenants-table
   Timestamp: 20250430105500

2. 20250430110000-create-default-tenant.ts
   Description: create-default-tenant
   Timestamp: 20250430110000

3. 20250430130000-update-existing-tables-to-include-default-tenant.ts
   Description: update-existing-tables-to-include-default-tenant
   Timestamp: 20250430130000

4. 20250618150000-update-authorizations-to-include-concurrenttransaction.ts
   Description: update-authorizations-to-include-concurrenttransaction
   Timestamp: 20250618150000

5. 20250621120000-flatten-authorization.ts
   Description: flatten-authorization
   Timestamp: 20250621120000

6. 20250714120500-create-tenant-partner-table.ts
   Description: create-tenant-partner-table
   Timestamp: 20250714120500

💡 Migration Selection Options:
   • Enter numbers separated by commas (e.g., 1,3,5)
   • Enter ranges with dashes (e.g., 1-5)
   • Mix both formats (e.g., 1,3-7,9)
   • Enter "all" to select all migrations
   • Enter "none" or empty to skip selection

Select migrations: 1-3,5
```

#### 2. Confirm Selection

```
✅ Selected 4 migrations:
   • 20250430105500-create-tenants-table.ts
   • 20250430110000-create-default-tenant.ts
   • 20250430130000-update-existing-tables-to-include-default-tenant.ts
   • 20250621120000-flatten-authorization.ts

Proceed with these selections? (y/N): y
```

#### 3. Name Your Batch

```
Enter batch name (e.g., "custom-v1.8.0", "hotfix-auth"): tenant-auth-hotfix
Enter batch description: Tenant setup and authorization flattening for hotfix deployment
```

#### 4. Generated Files

```
✅ Custom batch migration created: migrations/versions/tenant-auth-hotfix-consolidated.ts
📄 Metadata file created: migrations/versions/tenant-auth-hotfix-metadata.json

🚀 To run this custom batch migration:
   npm run migrate:custom tenant-auth-hotfix
```

## Migration Strategy Decision Tree

```
Are you setting up a fresh database?
├── Yes → Use consolidated migrations
│   └── npm run migrate:consolidated
│
└── No → Do you have existing migrations applied?
    ├── Yes → Use individual migrations
    │   └── npm run migrate
    │
    └── No, but upgrading from pre-1.8.0
        ├── Backup database first
        ├── Use individual migrations for safety
        └── npm run migrate

Need custom deployment?
├── Emergency hotfix → Use interactive selection
│   └── npm run migrate:select (pick critical fixes)
│
├── Feature-specific rollout → Use interactive selection
│   └── npm run migrate:select (pick feature migrations)
│
└── Development testing → Use interactive selection
    └── npm run migrate:select (pick test subset)
```

## Commands Reference

### NPM Scripts

| Command                                           | Description                                  |
| ------------------------------------------------- | -------------------------------------------- |
| `npm run migrate`                                 | Run individual migrations (traditional)      |
| `npm run migrate:consolidated`                    | Run all consolidated migrations              |
| `npm run migrate:consolidated:status`             | Check consolidated migration status          |
| `npm run migrate:version 1.8.0`                   | Run specific version migration               |
| `npm run migrate:rollback 1.7.0`                  | Rollback to specific version                 |
| `npm run migrate:manager report`                  | Generate migration report                    |
| `npm run migrate:manager list`                    | List migrations by version                   |
| `npm run migrate:manager batch`                   | Create version-based batches                 |
| `npm run migrate:select`                          | **Create custom batch with file selection**  |
| `npm run migrate:manager interactive`             | **Preview selection without creating batch** |
| `npm run migrate:custom your-batch-name`          | **Run custom batch migration**               |
| `npm run migrate:custom:list`                     | **List available custom batches**            |
| `npm run migrate:custom:rollback your-batch-name` | **Rollback custom batch**                    |
| `npm run migrate:check`                           | Check current migration status               |

### Direct Script Commands

```bash
# Migration Manager
node scripts/migration-manager.js select       # Interactive batch creation
node scripts/migration-manager.js interactive  # Preview selection
node scripts/migration-manager.js batch        # Auto-batch by version
node scripts/migration-manager.js list         # List by version
node scripts/migration-manager.js report       # Generate report

# Consolidated Runner
node scripts/run-consolidated-migration.js up                    # Run all pending
node scripts/run-consolidated-migration.js version 1.8.0         # Run specific version
node scripts/run-consolidated-migration.js custom batch-name     # Run custom batch
node scripts/run-consolidated-migration.js custom:rollback name  # Rollback custom
node scripts/run-consolidated-migration.js custom:list           # List custom batches
node scripts/run-consolidated-migration.js status                # Show status
```

## Selection Syntax

### Basic Syntax

| Input           | Result                     | Example                        |
| --------------- | -------------------------- | ------------------------------ |
| `1,3,5`         | Select specific migrations | Migrations 1, 3, and 5         |
| `1-5`           | Select range               | Migrations 1, 2, 3, 4, 5       |
| `1,3-7,9`       | Mixed selection            | Migrations 1, 3, 4, 5, 6, 7, 9 |
| `all`           | Select all migrations      | All available migrations       |
| `none` or empty | Cancel selection           | No migrations selected         |

### Advanced Examples

```bash
# Single migrations
Select migrations: 1,4,7
# Result: Selects migrations 1, 4, and 7

# Ranges
Select migrations: 1-5
# Result: Selects migrations 1, 2, 3, 4, and 5

# Mixed selection
Select migrations: 1,3-6,9,12-15
# Result: Selects migrations 1, 3, 4, 5, 6, 9, 12, 13, 14, and 15

# Special keywords
Select migrations: all
# Result: Selects all available migrations

Select migrations: none
# Result: Cancels selection

Select migrations:
# Result: Empty input cancels selection
```

## Use Cases & Examples

### 1. Emergency Hotfix

**Scenario**: Need to deploy only authorization-related fixes

```bash
npm run migrate:select
# Select: 4,5 (authorization migrations only)
# Name: "auth-emergency-hotfix"
# Description: "Critical authorization security fixes"
```

### 2. Tenant-Only Deployment

**Scenario**: Setting up multi-tenancy without other features

```bash
npm run migrate:select
# Select: 1-3,6 (tenant-related migrations)
# Name: "tenant-only-setup"
# Description: "Multi-tenant architecture setup"
```

### 3. Feature-Specific Rollout

**Scenario**: Rolling out specific features incrementally

```bash
npm run migrate:select
# Select: 1,3,7-9 (specific feature set)
# Name: "feature-async-jobs"
# Description: "Async job processing feature rollout"
```

### 4. Development Testing

**Scenario**: Testing migrations in development environment

```bash
npm run migrate:select
# Select: 2,4,6 (test subset)
# Name: "dev-test-subset"
# Description: "Development testing of specific migrations"
```

### 5. Phased Production Deployment

**Scenario**: Deploy features in phases to minimize risk

```bash
# Phase 1: Core infrastructure
npm run migrate:select
# Select: 1-3 (tenant setup)
# Name: "phase-1-infrastructure"

# Phase 2: Feature additions
npm run migrate:select
# Select: 4,5 (authorization improvements)
# Name: "phase-2-features"

# Phase 3: Advanced features
npm run migrate:select
# Select: 6-9 (async jobs and partnerships)
# Name: "phase-3-advanced"
```

**Get started:**

- New installation: `npm run migrate:consolidated`
- Existing installation: `npm run migrate`
- Custom deployment: `npm run migrate:select`
- Emergency hotfix: `npm run migrate:select` (pick critical fixes)

## Generated File Structure

### Metadata File

```json
{
  "batchName": "your-batch-name",
  "description": "Your description here",
  "createdAt": "2025-07-25T10:30:00.000Z",
  "migrations": [
    {
      "filename": "20250430105500-create-tenants-table.ts",
      "description": "create-tenants-table",
      "timestamp": "20250430105500"
    },
    {
      "filename": "20250430110000-create-default-tenant.ts",
      "description": "create-default-tenant",
      "timestamp": "20250430110000"
    },
    {
      "filename": "20250430130000-update-existing-tables-to-include-default-tenant.ts",
      "description": "update-existing-tables-to-include-default-tenant",
      "timestamp": "20250430130000"
    },
    {
      "filename": "20250621120000-flatten-authorization.ts",
      "description": "flatten-authorization",
      "timestamp": "20250621120000"
    }
  ]
}
```

## Management Workflows

### Create Custom Batch Workflow

```bash
# 1. Start interactive selection
npm run migrate:select

# 2. Select desired migrations
Select migrations: 1,3-5,7

# 3. Name and describe the batch
Enter batch name: my-custom-deployment
Enter batch description: Custom deployment for production hotfix

# 4. Review generated files
ls migrations/versions/my-custom-deployment-*

# 5. Implement the actual migration logic
# Edit migrations/versions/my-custom-deployment-consolidated.ts

# 6. Test in development environment
npm run migrate:custom my-custom-deployment

# 7. Deploy to production
npm run migrate:custom my-custom-deployment
```

### Management Operations

```bash
# List what batches you have
npm run migrate:custom:list

📋 Available Custom Batch Migrations:

🎯 tenant-auth-hotfix
   Description: Tenant setup and authorization flattening for hotfix deployment
   Created: 2025-07-25T10:30:00.000Z
   Migrations: 4 files

🎯 auth-emergency-hotfix
   Description: Critical authorization security fixes
   Created: 2025-07-25T11:15:00.000Z
   Migrations: 2 files

# Run a specific batch
npm run migrate:custom tenant-auth-hotfix

🎯 Running custom batch migration: tenant-auth-hotfix
Description: Tenant setup and authorization flattening for hotfix deployment
Created: 2025-07-25T10:30:00.000Z
Migrations included: 4
  • 20250430105500-create-tenants-table.ts: create-tenants-table
  • 20250430110000-create-default-tenant.ts: create-default-tenant
  • 20250430130000-update-existing-tables-to-include-default-tenant.ts: update-existing-tables-to-include-default-tenant
  • 20250621120000-flatten-authorization.ts: flatten-authorization

✅ Custom batch migration tenant-auth-hotfix completed successfully

# Check overall status
npm run migrate:consolidated:status

# Rollback if needed
npm run migrate:custom:rollback tenant-auth-hotfix

⏪ Rolling back custom batch migration: tenant-auth-hotfix
✅ Custom batch migration tenant-auth-hotfix rolled back successfully
```

## Database Backup & Recovery

### Before Major Version Upgrades

```bash
# PostgreSQL backup
pg_dump -U citrine -h localhost citrine > backup_pre_v1.8.0.sql

# Verify backup
pg_restore --list backup_pre_v1.8.0.sql

# Test restore (optional)
createdb citrine_test
psql citrine_test < backup_pre_v1.8.0.sql
```

### Rollback Procedures

```bash
# Rollback consolidated migration
npm run migrate:rollback 1.7.0

# Rollback individual migration
npx sequelize-cli db:migrate:undo

# Rollback custom batch
npm run migrate:custom:rollback your-batch-name

# Emergency restore from backup
# Stop application first
createdb citrine_restored
psql citrine_restored < backup_pre_v1.8.0.sql
```

## Version Configuration

The `migration-config.json` file defines version boundaries and features:

```json
{
  "versions": {
    "1.8.0": {
      "description": "Multi-tenant support and authorization flattening",
      "timestamp_range": {
        "start": "20250430000000",
        "end": "20250715999999"
      },
      "features": [
        "Multi-tenant architecture with Tenants table",
        "Authorization schema flattening for better performance",
        "Async job status tracking for background operations",
        "Tenant partner relationships",
        "Enhanced OCPI integration fields"
      ],
      "migrations": [
        "20250430105500-create-tenants-table.ts",
        "20250430110000-create-default-tenant.ts",
        "20250430130000-update-existing-tables-to-include-default-tenant.ts",
        "20250618150000-update-authorizations-to-include-concurrenttransaction.ts",
        "20250618150800-update-existing-authorization-to-include-realtimeauth.ts",
        "20250621120000-flatten-authorization.ts",
        "20250714120500-create-tenant-partner-table.ts",
        "20250714121000-alter-tenants-table-add-ocpi-fields.ts",
        "20250715000000-create-async-job-status.ts"
      ],
      "breaking_changes": [
        "Authorization table schema has been flattened - data migration required",
        "All existing tables now require tenantId - automatic assignment to default tenant"
      ],
      "upgrade_notes": [
        "Use the consolidated v1.8.0 migration for new installations",
        "Existing installations should run individual migrations in sequence",
        "Backup database before running authorization flattening migration"
      ]
    },
    "1.9.0": {
      "description": "Enhanced OCPP 2.0.1 features and performance improvements",
      "timestamp_range": {
        "start": "20250716000000",
        "end": "20250831999999"
      },
      "features": [],
      "migrations": [],
      "breaking_changes": [],
      "upgrade_notes": []
    }
  },
  "migration_strategy": {
    "individual": {
      "description": "Run individual migrations in chronological order",
      "recommended_for": "Existing installations with partial migrations applied",
      "command": "npm run migrate"
    },
    "consolidated": {
      "description": "Run version-specific consolidated migrations",
      "recommended_for": "New installations or major version upgrades",
      "command": "npm run migrate:consolidated"
    },
    "custom": {
      "description": "Run custom batch migrations with selected files",
      "recommended_for": "Emergency hotfixes, feature-specific deployments, development testing",
      "command": "npm run migrate:select"
    }
  }
}
```

## Breaking Changes in v1.8.0

### ⚠️ Authorization Schema

- **Structure changed**: Flattened from relational to direct columns
- **Data migration**: Automatic during migration process
- **API impact**: No change to public APIs
- **Performance**: Significant query performance improvement (60-80% faster)
- **Storage**: Reduced storage overhead from eliminated relationships

### ⚠️ Tenant Requirements

- **All tables**: Now require `tenantId` column
- **Default assignment**: Existing data assigned to tenant ID 1
- **New records**: Must specify valid tenant in application logic
- **Queries**: Consider tenant isolation in application queries
- **Indexes**: New tenant-based indexes for performance

### ⚠️ Database Schema

- **New tables**: Tenants, TenantPartners, AsyncJobStatuses
- **Modified tables**: All existing tables now include tenantId
- **New enums**: AsyncJobName enum for job tracking
- **Foreign keys**: New tenant-based relationships

## Performance Improvements

### Authorization Queries

- **Before**: Multi-table JOINs across IdTokens, IdTokenInfos, Authorizations
- **After**: Single table lookup with direct column access
- **Improvement**: 60-80% reduction in authorization query time
- **Impact**: Faster charging station authorization responses

### Multi-Tenancy

- **Scalability**: Support for thousands of tenants
- **Isolation**: Schema-level separation option
- **Performance**: Indexed tenant lookups
- **Resource usage**: More efficient memory and CPU utilization

### Async Operations

- **Background processing**: Long-running operations don't block main thread
- **Job tracking**: Real-time progress monitoring
- **Resource management**: Better handling of OCPI bulk operations
- **Error recovery**: Improved failure handling and retry mechanisms

## Troubleshooting

### Common Issues

#### 1. Migration Fails with "Table Already Exists"

```bash
# Check existing schema
\dt+ in PostgreSQL

# Check what migrations have been applied
npm run migrate:consolidated:status

# Use individual migrations instead
npm run migrate

# Or check for partial migrations
SELECT * FROM "SequelizeMeta" ORDER BY name;
```

#### 2. Authorization Data Missing After Migration

```bash
# Check temp tables (created during migration)
SELECT * FROM "Authorizations_temp" LIMIT 5;

# Verify data migration
SELECT COUNT(*) FROM "Authorizations" WHERE "idToken" IS NOT NULL;

# Check old vs new structure
SELECT
  COUNT(*) as total_authorizations,
  COUNT("idToken") as flattened_records,
  COUNT("idTokenId") as old_structure_records
FROM "Authorizations";
```

#### 3. Tenant Assignment Issues

```bash
# Verify default tenant exists
SELECT * FROM "Tenants" WHERE id = 1;

# Check tenant column assignment
SELECT COUNT(*) FROM "ChargingStations" WHERE "tenantId" = 1;

# Verify all tables have tenant data
SELECT
  'ChargingStations' as table_name, COUNT(*) as records_with_tenant
FROM "ChargingStations" WHERE "tenantId" IS NOT NULL
UNION ALL
SELECT
  'Authorizations', COUNT(*)
FROM "Authorizations" WHERE "tenantId" IS NOT NULL;
```

#### 4. Custom Batch Migration Issues

```bash
# Check if batch file exists
ls migrations/versions/your-batch-name-*

# Verify metadata
cat migrations/versions/your-batch-name-metadata.json

# Check migration tracking
SELECT * FROM "SequelizeMeta" WHERE name LIKE '%custom%';

# Validate template implementation
# Ensure you've replaced TODO comments with actual logic
```

#### 5. Performance Issues After Migration

```bash
# Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('Authorizations', 'Tenants')
ORDER BY tablename, attname;

# Verify authorization flattening worked
EXPLAIN ANALYZE
SELECT * FROM "Authorizations"
WHERE "idToken" = 'your-test-token';

# Check tenant query performance
EXPLAIN ANALYZE
SELECT * FROM "ChargingStations"
WHERE "tenantId" = 1;
```

### Recovery Procedures

#### 1. Complete Restore from Backup

```bash
# Stop application
sudo systemctl stop citrineos

# Drop and recreate database
dropdb citrine
createdb citrine

# Restore from backup
psql citrine < backup_pre_v1.8.0.sql

# Restart application
sudo systemctl start citrineos
```

#### 2. Partial Recovery (Rollback Specific Migration)

```bash
# Rollback consolidated migration
npm run migrate:rollback 1.8.0

# Or rollback custom batch
npm run migrate:custom:rollback your-batch-name

# Or rollback last individual migration
npx sequelize-cli db:migrate:undo
```

#### 3. Data Recovery from Temp Tables

```bash
# If temp tables still exist after failed migration
SELECT * FROM "Authorizations_temp";

# Restore authorization data
INSERT INTO "Authorizations" (
  "idTokenId", "idTokenInfoId", "allowedConnectorTypes",
  "disallowedEvseIdPrefixes", "tenantId", "createdAt", "updatedAt"
)
SELECT
  "idTokenId", "idTokenInfoId", "allowedConnectorTypes",
  "disallowedEvseIdPrefixes", 1, "createdAt", "updatedAt"
FROM "Authorizations_temp"
WHERE id NOT IN (SELECT id FROM "Authorizations");
```

## Best Practices

### Development

- **Test migrations**: Always test on copy of production data
- **Incremental changes**: Prefer smaller, focused migrations
- **Documentation**: Update migration config with clear descriptions
- **Rollback support**: Ensure all migrations can be rolled back
- **Version control**: Commit migration files with descriptive messages
- **Peer review**: Have migrations reviewed before production deployment

### Production

- **Backup first**: Always backup before major migrations
- **Maintenance window**: Schedule during low-traffic periods
- **Monitor closely**: Watch for performance issues after migration
- **Rollback plan**: Have tested rollback procedure ready
- **Communication**: Notify stakeholders of migration schedule
- **Health checks**: Verify application functionality post-migration

### Performance

- **Index creation**: Add indexes after data migration, not before
- **Batch operations**: Use transactions for large data movements
- **Monitor progress**: Log migration progress for large datasets
- **Resource planning**: Ensure adequate disk space and memory
- **Connection limits**: Consider database connection limits during migration
- **Query optimization**: Test query performance after schema changes

### Security

- **Access control**: Limit who can run production migrations
- **Audit trail**: Log all migration activities
- **Backup encryption**: Encrypt database backups
- **Environment separation**: Test in staging before production
- **Sensitive data**: Handle sensitive data appropriately during migrations
- **Rollback security**: Ensure rollback procedures are secure

## Advanced Scenarios

### Creating Migration Templates

```bash
# Create empty template for manual implementation
npm run migrate:select
# Select: none
# This creates a template you can modify manually
```

### Combining Different Migration Types

```bash
# You can mix different migration approaches:

# 1. Run standard version migrations
npm run migrate:version 1.8.0

# 2. Add custom features
npm run migrate:custom my-additional-features

# 3. Apply individual hotfixes
npm run migrate  # runs pending individual migrations
```

### Development Workflow

```bash
# 1. Create development subset for testing
npm run migrate:select
# Select: 2,4,6 (subset for testing)
# Name: "dev-test-subset"

# 2. Test in development
npm run migrate:custom dev-test-subset

# 3. Create staging batch (larger subset)
npm run migrate:select
# Select: 1-6 (more comprehensive)
# Name: "staging-validation"

# 4. Test in staging
npm run migrate:custom staging-validation

# 5. Create production batch (full set)
npm run migrate:select
# Select: all
# Name: "production-deployment"

# 6. Deploy to production
npm run migrate:custom production-deployment
```

### Emergency Hotfix Workflow

```bash
# 1. Identify critical migrations needed
npm run migrate:manager list

# 2. Select only critical fixes
npm run migrate:select
# Select: 4,5 (authorization security fixes)
# Name: "emergency-auth-fix"
# Description: "Critical authorization vulnerability fixes"

# 3. Test in development/staging
npm run migrate:custom emergency-auth-fix

# 4. Deploy to production quickly
npm run migrate:custom emergency-auth-fix

# 5. Plan comprehensive deployment later
npm run migrate:select
# Select: 1-9 (complete set)
# Name: "comprehensive-update"
```

## Future Versions

### Adding New Versions

#### 1. Update migration-config.json

```json
"1.9.0": {
  "description": "Enhanced OCPP 2.0.1 features and performance improvements",
  "timestamp_range": {
    "start": "20250716000000",
    "end": "20250831999999"
  },
  "features": [
    "Advanced OCPP 2.0.1 device management",
    "Enhanced certificate management",
    "Improved transaction handling"
  ],
  "breaking_changes": [
    "Certificate schema updates require data migration"
  ],
  "upgrade_notes": [
    "Backup certificates before upgrading",
    "Test certificate validation after migration"
  ]
}
```

#### 2. Create consolidated migration

```bash
# Generate template
npm run migrate:manager batch

# Implement migration logic in generated file
# migrations/v1.9.0-consolidated.ts
```

#### 3. Test thoroughly

- Fresh installation from scratch
- Upgrade from previous version (1.8.0)
- Custom batch combinations
- Rollback procedures

### Version Planning

- **Semantic versioning**: Follow semantic versioning for database schema
- **Backward compatibility**: Plan for backward compatibility when possible
- **Migration paths**: Provide clear upgrade paths between versions
- **Documentation**: Document all changes and impacts
- **Testing strategy**: Comprehensive testing across deployment scenarios

## Support & Contributing

### Getting Help

For issues with the migration system:

1. **Check logs**: Migration output includes detailed progress information
2. **Verify configuration**: Ensure database connection settings are correct
3. **Test environment**: Reproduce issue in development environment first
4. **Check documentation**: Review this guide and error messages carefully
5. **Community support**: Post issues to CitrineOS GitHub repository with:
   - Migration command used
   - Error messages and logs
   - Database version and configuration
   - Steps to reproduce
