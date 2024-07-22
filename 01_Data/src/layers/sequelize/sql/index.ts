/**
 * Will drop all views skipping geography_columns and geometry_columns since they are required by postgis plugin
 */
export const dropAllViews = `
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_schema, table_name 
        FROM information_schema.views 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND table_name NOT IN ('geography_columns', 'geometry_columns')
    ) LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END $$;
`;
