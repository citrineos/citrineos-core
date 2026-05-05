// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * One-shot port: read every `core/migrations/*.ts` legacy sequelize-cli
 * migration and emit an equivalent drizzle-format `.sql` file under
 * `nestjs/migrations/`. Each output file is named after its legacy
 * counterpart so devs can grep across both repos.
 *
 * Coverage:
 *   - `queryInterface.sequelize.query(`<sql>`)` → raw SQL passed through
 *   - `queryInterface.createTable(name, cols)` → `CREATE TABLE ...`
 *   - `queryInterface.dropTable(name)` → `DROP TABLE IF EXISTS ...`
 *   - `queryInterface.addColumn(table, col, opts)` → `ALTER TABLE ... ADD COLUMN ...`
 *   - `queryInterface.removeColumn(table, col)` → `ALTER TABLE ... DROP COLUMN`
 *   - `queryInterface.changeColumn(table, col, opts)` → `ALTER TABLE ... ALTER COLUMN ...`
 *   - `queryInterface.renameColumn(table, old, new)` → `ALTER TABLE ... RENAME COLUMN ...`
 *   - `queryInterface.addIndex(table, opts)` → `CREATE [UNIQUE] INDEX ...`
 *   - `queryInterface.removeIndex(table, name)` → `DROP INDEX ...`
 *   - `queryInterface.removeConstraint(table, name)` → `ALTER TABLE ... DROP CONSTRAINT`
 *   - `queryInterface.bulkInsert(table, rows)` → `INSERT ... ON CONFLICT DO NOTHING`
 *   - `queryInterface.bulkDelete(table, where)` → `DELETE FROM ...`
 *   - `if`/`try`/`Promise.all`/`.catch(...)` chains: walked through.
 *   - `queryInterface.sequelize.transaction((t) => { ... })`: callback walked.
 *
 * Anything the parser can't handle is emitted as a `-- UNTRANSLATED:`
 * line. Look for those after the run; the chunky `add-charging-station-pk-id`
 * migration in particular needs hand-translation to PL/pgSQL `DO $$ ... $$`
 * blocks since it walks `information_schema` at runtime.
 *
 * Run:  cd nestjs && npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/port-legacy-migrations.ts
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';

const MONOREPO_ROOT = join(__dirname, '..', '..');
const LEGACY_MIGRATIONS_DIR = join(MONOREPO_ROOT, 'migrations');
const OUTPUT_DIR = join(__dirname, '..', 'migrations');

interface ColumnDef {
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  unique: boolean | string;
  default?: string;
  references?: { table: string; field: string };
  onUpdate?: string;
  onDelete?: string;
}

const SEQUELIZE_TYPE_MAP: Record<string, (args: ts.Expression[]) => string> = {
  STRING: (args) => (args.length > 0 ? `VARCHAR(${literalNumber(args[0])})` : 'VARCHAR(255)'),
  TEXT: () => 'TEXT',
  INTEGER: () => 'INTEGER',
  BIGINT: () => 'BIGINT',
  SMALLINT: () => 'SMALLINT',
  FLOAT: () => 'REAL',
  DOUBLE: () => 'DOUBLE PRECISION',
  DECIMAL: (args) => (args.length > 0 ? `NUMERIC(${args.map(literal).join(', ')})` : 'NUMERIC'),
  BOOLEAN: () => 'BOOLEAN',
  DATE: () => 'TIMESTAMP WITH TIME ZONE',
  DATEONLY: () => 'DATE',
  TIME: () => 'TIME',
  UUID: () => 'UUID',
  JSON: () => 'JSON',
  JSONB: () => 'JSONB',
  BLOB: () => 'BYTEA',
  ARRAY: (args) =>
    args.length > 0 ? `${translateSequelizeType(args[0] as ts.Expression)}[]` : 'TEXT[]',
};

function literalNumber(node: ts.Expression): string {
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isStringLiteral(node)) return node.text;
  return node.getText();
}

function literal(node: ts.Expression): string {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return `'${node.text.replace(/'/g, "''")}'`;
  }
  if (ts.isNumericLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'true';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'false';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'NULL';
  return node.getText();
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function evalLiteralOrIdentifier(node: ts.Expression, scope: Map<string, string>): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return scope.get(node.text) ?? null;
  if (ts.isPropertyAccessExpression(node)) {
    // e.g. `DEFAULT_TENANT_ID` imported as a const — most show up as
    // simple Identifier nodes; this branch handles the
    // `Foo.BAR` shape if someone writes it that way.
    const name = node.name.text;
    return scope.get(name) ?? null;
  }
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      const v = evalLiteralOrIdentifier(span.expression, scope);
      if (v === null) return null;
      out += v + span.literal.text;
    }
    return out;
  }
  return null;
}

function translateSequelizeType(typeExpr: ts.Expression): string {
  // String-literal type (some legacy migrations use this shape):
  // `type: 'VARCHAR(255)'` → emit verbatim.
  if (ts.isStringLiteral(typeExpr) || ts.isNoSubstitutionTemplateLiteral(typeExpr)) {
    return typeExpr.text;
  }
  if (ts.isPropertyAccessExpression(typeExpr)) {
    const name = typeExpr.name.text;
    const fn = SEQUELIZE_TYPE_MAP[name];
    return fn ? fn([]) : `/* unknown DataTypes.${name} */`;
  }
  if (ts.isCallExpression(typeExpr) && ts.isPropertyAccessExpression(typeExpr.expression)) {
    const name = typeExpr.expression.name.text;
    const fn = SEQUELIZE_TYPE_MAP[name];
    return fn ? fn([...typeExpr.arguments]) : `/* unknown DataTypes.${name}(...) */`;
  }
  return `/* unknown type ${typeExpr.getText()} */`;
}

function translateDefault(expr: ts.Expression): string {
  if (ts.isPropertyAccessExpression(expr)) {
    if (expr.name.text === 'NOW') return 'CURRENT_TIMESTAMP';
    if (expr.name.text === 'UUIDV4') return 'gen_random_uuid()';
  }
  return literal(expr);
}

function parseColumnOptions(
  obj: ts.ObjectLiteralExpression,
  scope: Map<string, string>,
): ColumnDef {
  const def: ColumnDef = {
    type: '/* missing */',
    notNull: false,
    primaryKey: false,
    autoIncrement: false,
    unique: false,
  };
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const key = prop.name.text;
    const value = prop.initializer;
    switch (key) {
      case 'type':
        def.type = translateSequelizeType(value);
        break;
      case 'allowNull':
        def.notNull = value.kind === ts.SyntaxKind.FalseKeyword;
        break;
      case 'primaryKey':
        def.primaryKey = value.kind === ts.SyntaxKind.TrueKeyword;
        break;
      case 'autoIncrement':
        def.autoIncrement = value.kind === ts.SyntaxKind.TrueKeyword;
        break;
      case 'unique':
        def.unique =
          value.kind === ts.SyntaxKind.TrueKeyword
            ? true
            : ts.isStringLiteral(value)
              ? value.text
              : false;
        break;
      case 'defaultValue':
        def.default = translateDefault(value);
        break;
      case 'onUpdate':
        if (ts.isStringLiteral(value)) def.onUpdate = value.text;
        break;
      case 'onDelete':
        if (ts.isStringLiteral(value)) def.onDelete = value.text;
        break;
      case 'references': {
        if (ts.isObjectLiteralExpression(value)) {
          const ref: { table?: string; field?: string } = {};
          for (const rp of value.properties) {
            if (!ts.isPropertyAssignment(rp) || !ts.isIdentifier(rp.name)) continue;
            const v = evalLiteralOrIdentifier(rp.initializer, scope);
            if (rp.name.text === 'model') ref.table = v ?? undefined;
            if (rp.name.text === 'key') ref.field = v ?? undefined;
          }
          if (ref.table && ref.field) def.references = { table: ref.table, field: ref.field };
        }
        break;
      }
    }
  }
  return def;
}

function columnDefinitionSql(name: string, def: ColumnDef): string {
  let type = def.type;
  if (def.autoIncrement && /^INTEGER$/i.test(type)) type = 'SERIAL';
  if (def.autoIncrement && /^BIGINT$/i.test(type)) type = 'BIGSERIAL';
  const parts = [quoteIdent(name), type];
  if (def.primaryKey) parts.push('PRIMARY KEY');
  if (def.notNull && !def.primaryKey) parts.push('NOT NULL');
  if (def.unique === true) parts.push('UNIQUE');
  if (def.default !== undefined) parts.push(`DEFAULT ${def.default}`);
  if (def.references) {
    parts.push(
      `REFERENCES ${quoteIdent(def.references.table)}(${quoteIdent(def.references.field)})`,
    );
    if (def.onDelete) parts.push(`ON DELETE ${def.onDelete}`);
    if (def.onUpdate) parts.push(`ON UPDATE ${def.onUpdate}`);
  }
  return parts.join(' ');
}

function translateUpStatements(
  fn: ts.ArrowFunction | ts.FunctionExpression,
  scope: Map<string, string>,
): { statements: string[]; untranslated: number } {
  const stmts: string[] = [];
  let untranslated = 0;
  if (!fn.body || !ts.isBlock(fn.body)) {
    return { statements: [`-- UNTRANSLATED: non-block function body`], untranslated: 1 };
  }
  for (const node of fn.body.statements) {
    const result = translateStatement(node, scope);
    stmts.push(...result.statements);
    untranslated += result.untranslated;
  }
  return { statements: stmts, untranslated };
}

function translateStatement(
  node: ts.Statement,
  scope: Map<string, string>,
): { statements: string[]; untranslated: number } {
  if (ts.isVariableStatement(node)) {
    for (const decl of node.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) {
        const v = evalLiteralOrIdentifier(decl.initializer, scope);
        if (v !== null) scope.set(decl.name.text, v);
      }
    }
    return { statements: [], untranslated: 0 };
  }
  if (ts.isIfStatement(node)) {
    // Walk both branches — the `if` is usually an existence guard
    // that our `IF NOT EXISTS` clauses make redundant.
    const out: string[] = [];
    let unt = 0;
    const walk = (s: ts.Statement | undefined) => {
      if (!s) return;
      if (ts.isBlock(s)) {
        for (const inner of s.statements) {
          const r = translateStatement(inner, scope);
          out.push(...r.statements);
          unt += r.untranslated;
        }
      } else {
        const r = translateStatement(s, scope);
        out.push(...r.statements);
        unt += r.untranslated;
      }
    };
    walk(node.thenStatement);
    walk(node.elseStatement);
    return { statements: out, untranslated: unt };
  }
  if (ts.isTryStatement(node)) {
    const out: string[] = [];
    let unt = 0;
    for (const inner of node.tryBlock.statements) {
      const r = translateStatement(inner, scope);
      out.push(...r.statements);
      unt += r.untranslated;
    }
    return { statements: out, untranslated: unt };
  }
  if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node)) {
    return {
      statements: [
        `-- UNTRANSLATED loop (consider a PL/pgSQL DO block): ${node.getText().replace(/\n/g, ' ').slice(0, 200)}`,
      ],
      untranslated: 1,
    };
  }
  if (ts.isExpressionStatement(node)) {
    let expr = node.expression;
    if (ts.isAwaitExpression(expr)) expr = expr.expression;
    while (
      ts.isCallExpression(expr) &&
      ts.isPropertyAccessExpression(expr.expression) &&
      expr.expression.name.text === 'catch'
    ) {
      expr = expr.expression.expression;
    }
    if (ts.isCallExpression(expr)) return translateCall(expr, scope);
    return {
      statements: [`-- UNTRANSLATED: ${node.getText().replace(/\n/g, ' ').slice(0, 120)}`],
      untranslated: 1,
    };
  }
  return {
    statements: [`-- UNTRANSLATED: ${node.getText().replace(/\n/g, ' ').slice(0, 120)}`],
    untranslated: 1,
  };
}

function translateCall(
  call: ts.CallExpression,
  scope: Map<string, string>,
): { statements: string[]; untranslated: number } {
  const sql = (s: string) => ({ statements: [s], untranslated: 0 });
  const skip = (reason: string) => ({
    statements: [
      `-- UNTRANSLATED (${reason}): ${call.getText().replace(/\n/g, ' ').slice(0, 200)}`,
    ],
    untranslated: 1,
  });

  // queryInterface.sequelize.query(`<sql>`)
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    call.expression.name.text === 'query' &&
    ts.isPropertyAccessExpression(call.expression.expression) &&
    call.expression.expression.name.text === 'sequelize'
  ) {
    if (call.arguments.length === 0) return skip('empty query');
    const arg = call.arguments[0];
    if (ts.isNoSubstitutionTemplateLiteral(arg) || ts.isStringLiteral(arg)) {
      return sql(arg.text.trim() + ';');
    }
    if (ts.isTemplateExpression(arg)) {
      let out = arg.head.text;
      for (const span of arg.templateSpans) {
        const v = evalLiteralOrIdentifier(span.expression, scope);
        if (v === null) return skip('dynamic template substitution');
        out += v + span.literal.text;
      }
      return sql(out.trim() + ';');
    }
    return skip('non-literal query arg');
  }

  // queryInterface.sequelize.transaction((t) => { ... })
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    call.expression.name.text === 'transaction' &&
    ts.isPropertyAccessExpression(call.expression.expression) &&
    call.expression.expression.name.text === 'sequelize'
  ) {
    const cb = call.arguments[0];
    if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.body) {
      const body = ts.isBlock(cb.body) ? cb.body : null;
      if (body) {
        const out: string[] = [];
        let unt = 0;
        for (const s of body.statements) {
          const r = translateStatement(s, scope);
          out.push(...r.statements);
          unt += r.untranslated;
        }
        return { statements: out, untranslated: unt };
      }
    }
    return skip('transaction wrapper shape');
  }

  // console.log → drop
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression) &&
    call.expression.expression.text === 'console'
  ) {
    return { statements: [], untranslated: 0 };
  }

  // queryInterface.<helper>(...)
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.expression) &&
    call.expression.expression.text === 'queryInterface'
  ) {
    const helper = call.expression.name.text;
    const args = call.arguments;
    const tableArg = args[0];
    const tableName = tableArg ? evalLiteralOrIdentifier(tableArg, scope) : null;

    switch (helper) {
      case 'createTable': {
        if (!tableName || args.length < 2 || !ts.isObjectLiteralExpression(args[1])) {
          return skip('createTable shape');
        }
        const colDefs: string[] = [];
        for (const prop of args[1].properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const colName = ts.isIdentifier(prop.name)
            ? prop.name.text
            : ts.isStringLiteral(prop.name)
              ? prop.name.text
              : null;
          if (!colName) continue;
          if (!ts.isObjectLiteralExpression(prop.initializer)) {
            colDefs.push(`-- UNTRANSLATED column ${colName}`);
            continue;
          }
          const def = parseColumnOptions(prop.initializer, scope);
          colDefs.push('    ' + columnDefinitionSql(colName, def));
        }
        return sql(
          `CREATE TABLE IF NOT EXISTS ${quoteIdent(tableName)} (\n${colDefs.join(',\n')}\n);`,
        );
      }
      case 'dropTable': {
        if (!tableName) return skip('dropTable shape');
        return sql(`DROP TABLE IF EXISTS ${quoteIdent(tableName)};`);
      }
      case 'addColumn': {
        if (!tableName || args.length < 3) return skip('addColumn shape');
        const colName = evalLiteralOrIdentifier(args[1], scope);
        if (!colName || !ts.isObjectLiteralExpression(args[2])) return skip('addColumn shape');
        const def = parseColumnOptions(args[2], scope);
        return sql(
          `ALTER TABLE ${quoteIdent(tableName)} ADD COLUMN IF NOT EXISTS ${columnDefinitionSql(colName, def)};`,
        );
      }
      case 'removeColumn': {
        if (!tableName || args.length < 2) return skip('removeColumn shape');
        const colName = evalLiteralOrIdentifier(args[1], scope);
        if (!colName) return skip('removeColumn shape');
        return sql(
          `ALTER TABLE ${quoteIdent(tableName)} DROP COLUMN IF EXISTS ${quoteIdent(colName)};`,
        );
      }
      case 'renameColumn': {
        if (!tableName || args.length < 3) return skip('renameColumn shape');
        const oldName = evalLiteralOrIdentifier(args[1], scope);
        const newName = evalLiteralOrIdentifier(args[2], scope);
        if (!oldName || !newName) return skip('renameColumn shape');
        return sql(
          `ALTER TABLE ${quoteIdent(tableName)} RENAME COLUMN ${quoteIdent(oldName)} TO ${quoteIdent(newName)};`,
        );
      }
      case 'changeColumn': {
        if (!tableName || args.length < 3) return skip('changeColumn shape');
        const colName = evalLiteralOrIdentifier(args[1], scope);
        if (!colName || !ts.isObjectLiteralExpression(args[2])) return skip('changeColumn shape');
        const def = parseColumnOptions(args[2], scope);
        const stmts: string[] = [
          `ALTER TABLE ${quoteIdent(tableName)} ALTER COLUMN ${quoteIdent(colName)} TYPE ${def.type};`,
        ];
        if (def.notNull) {
          stmts.push(
            `ALTER TABLE ${quoteIdent(tableName)} ALTER COLUMN ${quoteIdent(colName)} SET NOT NULL;`,
          );
        } else {
          stmts.push(
            `ALTER TABLE ${quoteIdent(tableName)} ALTER COLUMN ${quoteIdent(colName)} DROP NOT NULL;`,
          );
        }
        if (def.default !== undefined) {
          stmts.push(
            `ALTER TABLE ${quoteIdent(tableName)} ALTER COLUMN ${quoteIdent(colName)} SET DEFAULT ${def.default};`,
          );
        }
        return { statements: stmts, untranslated: 0 };
      }
      case 'addIndex': {
        if (!tableName || args.length < 2) return skip('addIndex shape');
        const opts = ts.isObjectLiteralExpression(args[1]) ? args[1] : null;
        if (!opts) return skip('addIndex non-object opts');
        let unique = false;
        let name: string | null = null;
        const fieldsArr: string[] = [];
        for (const prop of opts.properties) {
          if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
          if (prop.name.text === 'unique' && prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
            unique = true;
          }
          if (prop.name.text === 'name') {
            const n = evalLiteralOrIdentifier(prop.initializer, scope);
            if (n !== null) name = n;
          }
          if (prop.name.text === 'fields' && ts.isArrayLiteralExpression(prop.initializer)) {
            for (const el of prop.initializer.elements) {
              const v = evalLiteralOrIdentifier(el, scope);
              if (v !== null) fieldsArr.push(quoteIdent(v));
            }
          }
          if (prop.name.text === 'where') {
            return skip('addIndex with where clause — translate by hand');
          }
        }
        if (fieldsArr.length === 0) return skip('addIndex no fields');
        const idxName =
          name ?? `${tableName}_${fieldsArr.map((f) => f.replace(/"/g, '')).join('_')}_idx`;
        return sql(
          `CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${quoteIdent(idxName)} ON ${quoteIdent(tableName)} (${fieldsArr.join(', ')});`,
        );
      }
      case 'removeIndex': {
        if (!tableName || args.length < 2) return skip('removeIndex shape');
        const indexName = evalLiteralOrIdentifier(args[1], scope);
        if (!indexName) return skip('removeIndex shape');
        return sql(`DROP INDEX IF EXISTS ${quoteIdent(indexName)};`);
      }
      case 'addConstraint': {
        return skip('addConstraint — translate by hand');
      }
      case 'removeConstraint': {
        if (!tableName || args.length < 2) return skip('removeConstraint shape');
        const cname = evalLiteralOrIdentifier(args[1], scope);
        if (!cname) return skip('removeConstraint shape');
        return sql(
          `ALTER TABLE ${quoteIdent(tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(cname)};`,
        );
      }
      case 'bulkInsert': {
        if (!tableName || args.length < 2 || !ts.isArrayLiteralExpression(args[1])) {
          return skip('bulkInsert shape');
        }
        const rows: string[] = [];
        let columnList: string[] = [];
        for (const row of args[1].elements) {
          if (!ts.isObjectLiteralExpression(row)) return skip('bulkInsert non-object row');
          const cols: string[] = [];
          const vals: string[] = [];
          for (const prop of row.properties) {
            if (!ts.isPropertyAssignment(prop)) continue;
            const colName = ts.isIdentifier(prop.name)
              ? prop.name.text
              : ts.isStringLiteral(prop.name)
                ? prop.name.text
                : null;
            if (!colName) continue;
            cols.push(quoteIdent(colName));
            const v = prop.initializer;
            if (
              ts.isNewExpression(v) &&
              ts.isIdentifier(v.expression) &&
              v.expression.text === 'Date'
            ) {
              vals.push('CURRENT_TIMESTAMP');
            } else if (ts.isIdentifier(v)) {
              const looked = scope.get(v.text);
              vals.push(looked !== undefined ? `'${looked.replace(/'/g, "''")}'` : v.text);
            } else {
              vals.push(literal(v));
            }
          }
          if (columnList.length === 0) columnList = cols;
          rows.push(`(${vals.join(', ')})`);
        }
        return sql(
          `INSERT INTO ${quoteIdent(tableName)} (${columnList.join(', ')}) VALUES\n  ${rows.join(',\n  ')}\nON CONFLICT DO NOTHING;`,
        );
      }
      case 'bulkDelete': {
        if (!tableName || args.length < 2 || !ts.isObjectLiteralExpression(args[1])) {
          return skip('bulkDelete shape');
        }
        const conds: string[] = [];
        for (const prop of args[1].properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const colName = ts.isIdentifier(prop.name)
            ? prop.name.text
            : ts.isStringLiteral(prop.name)
              ? prop.name.text
              : null;
          if (!colName) continue;
          conds.push(`${quoteIdent(colName)} = ${literal(prop.initializer)}`);
        }
        return sql(
          `DELETE FROM ${quoteIdent(tableName)}${conds.length ? ` WHERE ${conds.join(' AND ')}` : ''};`,
        );
      }
    }
  }
  return skip(`unknown call ${call.expression.getText().replace(/\n/g, ' ').slice(0, 60)}`);
}

interface PortReport {
  file: string;
  outputPath: string;
  statements: number;
  untranslated: number;
}

function translateFile(filePath: string): { sql: string; untranslated: number } {
  const text = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);

  const scope = new Map<string, string>();
  let untranslated = 0;
  const statements: string[] = [];

  ts.forEachChild(sf, (node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          const v = evalLiteralOrIdentifier(decl.initializer, scope);
          if (v !== null) scope.set(decl.name.text, v);
        }
      }
    }
    if (ts.isExportAssignment(node) && ts.isObjectLiteralExpression(node.expression)) {
      for (const prop of node.expression.properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === 'up'
        ) {
          const fn = prop.initializer;
          if (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) {
            const r = translateUpStatements(fn, scope);
            statements.push(...r.statements);
            untranslated += r.untranslated;
          }
        }
        if (ts.isMethodDeclaration(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'up') {
          if (prop.body) {
            for (const s of prop.body.statements) {
              const r = translateStatement(s, scope);
              statements.push(...r.statements);
              untranslated += r.untranslated;
            }
          }
        }
      }
    }
  });

  // Drizzle uses `--> statement-breakpoint` between statements; emit one
  // between each top-level statement so the migrator runs them as
  // separate transactions where possible.
  const joined = statements.join('\n--> statement-breakpoint\n');
  return { sql: joined + '\n', untranslated };
}

function buildJournal(filenames: string[]): string {
  // Drizzle-kit's journal format. We assign sequential indices.
  const entries = filenames.map((f, idx) => ({
    idx,
    version: '7',
    when: Date.now() + idx,
    tag: f.replace(/\.sql$/, ''),
    breakpoints: true,
  }));
  return JSON.stringify({ version: '7', dialect: 'postgresql', entries }, null, 2);
}

function main(): void {
  if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(join(OUTPUT_DIR, 'meta'), { recursive: true });

  const files = readdirSync(LEGACY_MIGRATIONS_DIR)
    .filter((f) => /^\d{14}.*\.ts$/.test(f))
    .sort();

  const reports: PortReport[] = [];
  const filenames: string[] = [];
  let idx = 0;
  for (const file of files) {
    const fullPath = join(LEGACY_MIGRATIONS_DIR, file);
    const slug = file
      .replace(/^\d{14}-?/, '')
      .replace(/\.ts$/, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .toLowerCase();
    const outName = `${String(idx).padStart(4, '0')}_${slug}.sql`;
    const out = join(OUTPUT_DIR, outName);

    const { sql, untranslated } = translateFile(fullPath);
    const header = `-- Ported from legacy migration: migrations/${file}\n-- Auto-generated by scripts/port-legacy-migrations.ts\n\n`;
    writeFileSync(out, header + sql);
    reports.push({ file, outputPath: out, statements: sql.split(';').length - 1, untranslated });
    filenames.push(outName);
    idx++;
  }

  // Write journal so drizzle-kit knows the migration order.
  writeFileSync(join(OUTPUT_DIR, 'meta', '_journal.json'), buildJournal(filenames));

  console.log('\nPort summary:');
  console.log('─'.repeat(80));
  let totalUntranslated = 0;
  for (const r of reports) {
    const flag = r.untranslated > 0 ? `⚠️  ${r.untranslated}` : '✅';
    console.log(`  ${flag.padEnd(6)}  ${r.file.padEnd(70)}`);
    totalUntranslated += r.untranslated;
  }
  console.log('─'.repeat(80));
  console.log(`Total files: ${reports.length}`);
  console.log(`Total untranslated calls: ${totalUntranslated}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  if (totalUntranslated > 0) {
    console.log('\nLook for `-- UNTRANSLATED` lines in the output and translate by hand');
    console.log('(typically into PL/pgSQL `DO $$ ... $$` blocks for the loop-y bits).');
  }
}

main();
