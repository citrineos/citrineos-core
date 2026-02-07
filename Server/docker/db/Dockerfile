# for the apple silicon arm deployment
FROM postgres:16

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgis postgresql-16-postgis-3 \
  && rm -rf /var/lib/apt/lists/*

COPY 01_enable_postgis.sql /docker-entrypoint-initdb.d/01_enable_postgis.sql
