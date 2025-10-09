# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install --workspaces
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app

# Copy runtime bits
COPY --from=build /app/Server /app/Server
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package*.json /app/
# Workspaces needed at runtime for linked packages
COPY --from=build /app/00_Base /app/00_Base
COPY --from=build /app/01_Data /app/01_Data
COPY --from=build /app/02_Util /app/02_Util
COPY --from=build /app/03_Modules /app/03_Modules

# Nice-to-have data dir + defaults that npm start used to set
RUN mkdir -p /data
ENV APP_NAME=all \
    APP_ENV=local \
    BOOTSTRAP_CITRINEOS_CONFIG_FILENAME=config.json \
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE=local \
    BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH=/data \
    NODE_ENV=production

# Run the already-built server
CMD ["node", "/app/Server/dist/index.js"]
