// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  classToJsonSchema,
  defaultClassValidatorJsonSchemaOptions,
  nestedClassToJsonSchema,
  refPointerPrefix,
} from '../../src/openapi-spec-helper/class-validator.js';
import { SchemaStore } from '../../src/openapi-spec-helper/schema-store.js';
import { Optional } from '../../src/util/decorators/optional.js';
import { Enum } from '../../src/util/decorators/enum.js';

enum Status {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

class Child {
  @IsString()
  @IsNotEmpty()
  label!: string;
}

class Primitives {
  @IsString()
  name!: string;

  @IsInt()
  count!: number;

  @IsBoolean()
  flag!: boolean;

  @IsDateString()
  startedAt!: string;

  @Optional()
  @IsString()
  note?: string;
}

class EnumHolder {
  @Enum(Status, 'Status')
  status!: Status;
}

class NestedHolder {
  @ValidateNested()
  @Type(() => Child)
  child!: Child;

  @Optional()
  @ValidateNested()
  @Type(() => Child)
  maybeChild?: Child;
}

// no @Type() and no emitted design:type, so the nested converter cannot resolve a child schema
class UntypedNested {
  @Optional()
  @ValidateNested()
  blob?: object;
}

// @Type(() => Object) resolves to the '#/components/schemas/Object' ref,
// which the nested converter rewrites to the owning class name
class ObjectTyped {
  @ValidateNested()
  @Type(() => Object)
  data!: object;
}

class ArrayHolder {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Child)
  children!: Child[];

  @Optional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Child)
  maybeChildren?: Child[];

  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

beforeEach(() => {
  // module-level singleton; conversions below repopulate it per test
  SchemaStore.components.schemas = {};
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('classToJsonSchema', () => {
  it('maps primitive validators to json-schema types', () => {
    const schema = classToJsonSchema(Primitives) as any;

    expect(schema.type).toBe('object');
    expect(schema.properties.name).toEqual({ type: 'string' });
    expect(schema.properties.count).toEqual({ type: 'integer' });
    expect(schema.properties.flag).toEqual({ type: 'boolean' });
  });

  it('maps @IsDateString to a date-time string', () => {
    const schema = classToJsonSchema(Primitives) as any;

    expect(schema.properties.startedAt).toEqual({ format: 'date-time', type: 'string' });
  });

  it('drops @Optional properties from required but keeps their type', () => {
    const schema = classToJsonSchema(Primitives) as any;

    expect(schema.properties.note).toEqual({ type: 'string' });
    expect(schema.required).toEqual(['name', 'count', 'flag', 'startedAt']);
  });

  it('replaces @Enum properties with a $ref and registers the enum schema', () => {
    const schema = classToJsonSchema(EnumHolder) as any;

    expect(schema.properties.status).toEqual({ $ref: '#/components/schemas/Status' });
    expect(schema.required).toEqual(['status']);
    expect(SchemaStore.getSchema('Status')).toEqual({
      type: 'string',
      enum: ['ACTIVE', 'BLOCKED'],
    });
  });

  it('registers an enum schema only once across conversions', () => {
    const addSchema = vi.spyOn(SchemaStore, 'addSchema');

    classToJsonSchema(EnumHolder);
    classToJsonSchema(EnumHolder);

    expect(addSchema).toHaveBeenCalledTimes(1);
    expect(addSchema).toHaveBeenCalledWith('Status', {
      type: 'string',
      enum: ['ACTIVE', 'BLOCKED'],
    });
  });

  it('turns a required nested class into a bare $ref and stores the child schema', () => {
    const schema = classToJsonSchema(NestedHolder) as any;

    expect(schema.properties.child).toEqual({ $ref: '#/components/schemas/Child' });
    expect(schema.required).toEqual(['child']);
    expect(SchemaStore.getSchema('Child')).toEqual({
      properties: {
        label: { minLength: 1, type: 'string' },
      },
      type: 'object',
      required: ['label'],
    });
  });

  it('marks an @Optional nested class nullable next to its $ref', () => {
    const schema = classToJsonSchema(NestedHolder) as any;

    expect(schema.properties.maybeChild).toEqual({
      nullable: true,
      $ref: '#/components/schemas/Child',
    });
  });

  it('falls back to nullable-only when an optional nested property has no resolvable type', () => {
    const schema = classToJsonSchema(UntypedNested) as any;

    expect(schema.properties.blob).toEqual({ nullable: true });
    expect(schema.required).toBeUndefined();
  });

  it('rewrites an Object-typed nested $ref to the owning class name', () => {
    const schema = classToJsonSchema(ObjectTyped) as any;

    expect(schema.properties.data).toEqual({ $ref: '#/components/schemas/ObjectTyped' });
  });

  it('converts a typed class array to array-of-$ref and stores the item schema', () => {
    const schema = classToJsonSchema(ArrayHolder) as any;

    expect(schema.properties.children).toEqual({
      type: 'array',
      items: { $ref: '#/components/schemas/Child' },
    });
    expect(SchemaStore.getSchema('Child')).toEqual({
      properties: {
        label: { minLength: 1, type: 'string' },
      },
      type: 'object',
      required: ['label'],
    });
  });

  it('adds nullable to an @Optional class array', () => {
    const schema = classToJsonSchema(ArrayHolder) as any;

    expect(schema.properties.maybeChildren).toEqual({
      type: 'array',
      items: { $ref: '#/components/schemas/Child' },
      nullable: true,
    });
    expect(schema.required).toEqual(['children', 'tags']);
  });

  it('keeps primitive arrays inline without a $ref', () => {
    const schema = classToJsonSchema(ArrayHolder) as any;

    expect(schema.properties.tags).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('throws for a non-class input', () => {
    expect(() => classToJsonSchema(undefined as any)).toThrow(
      new TypeError("Cannot read properties of undefined (reading 'prototype')"),
    );
  });
});

describe('nestedClassToJsonSchema', () => {
  it('produces the child fragment with default options', () => {
    const schema = nestedClassToJsonSchema(Child, defaultClassValidatorJsonSchemaOptions) as any;

    expect(schema).toEqual({
      properties: {
        label: { minLength: 1, type: 'string' },
      },
      type: 'object',
      required: ['label'],
    });
  });
});

describe('defaultClassValidatorJsonSchemaOptions', () => {
  it('uses the shared ref pointer prefix', () => {
    expect(refPointerPrefix).toBe('#/components/schemas/');
    expect(defaultClassValidatorJsonSchemaOptions.refPointerPrefix).toBe('#/components/schemas/');
  });
});
