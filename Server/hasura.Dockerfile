FROM hasura/graphql-engine:v2.40.3.cli-migrations-v3

COPY ./hasura-metadata /hasura-metadata