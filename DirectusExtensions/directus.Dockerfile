FROM directus/directus:10.10.5

# Build directus extensions
USER root
COPY tsconfig.build.json /directus
# Charging stations bundle
COPY charging-stations-bundle/tsconfig.json /directus/extensions/directus-extension-charging-stations-bundle/tsconfig.json
COPY charging-stations-bundle/package.json /directus/extensions/directus-extension-charging-stations-bundle/package.json
COPY charging-stations-bundle/src /directus/extensions/directus-extension-charging-stations-bundle/src
RUN npm install --prefix /directus/extensions/directus-extension-charging-stations-bundle && npm run build --prefix /directus/extensions/directus-extension-charging-stations-bundle

# Copy config file for cloud deployment
ARG CONFIG_FILE
COPY ${CONFIG_FILE} /directus/config.cjs

USER node