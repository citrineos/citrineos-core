# Usa la imagen base original
FROM citrineos/postgis:v1.1.0


# Scripts for the DB initialization
COPY config/setup-user.sh /docker-entrypoint-initdb.d/100-setup-user.sh

#EXPOSE 5432