FROM directus/directus:10.10.5

# Buid directus extensions
USER root
COPY tsconfig.build.json /directus
# Charging stations bundle
COPY DirectusExtensions/charging-stations-bundle/tsconfig.json /directus/extensions/directus-extension-charging-stations-bundle/tsconfig.json
COPY DirectusExtensions/charging-stations-bundle/package.json /directus/extensions/directus-extension-charging-stations-bundle/package.json
COPY DirectusExtensions/charging-stations-bundle/src /directus/extensions/directus-extension-charging-stations-bundle/src
RUN npm install --prefix /directus/extensions/directus-extension-charging-stations-bundle && npm run build --prefix /directus/extensions/directus-extension-charging-stations-bundle
USER node

# Copy needed files
COPY Server/data/directus/uploads /directus/uploads
COPY Server/directus-env-config.cjs /directus/config.cjs