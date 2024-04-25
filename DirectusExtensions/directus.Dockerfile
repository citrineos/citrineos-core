FROM directus/directus:10.10.5

# Buid directus extensions
USER root
COPY tsconfig.build.json /directus
# Charging stations bundle
COPY charging-stations-bundle/tsconfig.json /directus/extensions/directus-extension-charging-stations-bundle/tsconfig.json
COPY charging-stations-bundle/package.json /directus/extensions/directus-extension-charging-stations-bundle/package.json
COPY charging-stations-bundle/src /directus/extensions/directus-extension-charging-stations-bundle/src
RUN npm install --prefix /directus/extensions/directus-extension-charging-stations-bundle && npm run build --prefix /directus/extensions/directus-extension-charging-stations-bundle
USER node

# Note: if creating image for cloud deployment where host mirroring is not possible, Server/data and Server/directus-env-config.cjs will need to be copied into the image