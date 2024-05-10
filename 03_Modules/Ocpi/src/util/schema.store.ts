export const SchemaStore = {
  components: {
    schemas: {}
  },

  addSchema(name: string, schema: object) {
    (this.components.schemas as any)[name] = schema;
  },

  getSchema(name: string) {
    return (this.components.schemas as any)[name] as any;
  },

  getAllSchemas() {
    return this.components.schemas;
  }
};
