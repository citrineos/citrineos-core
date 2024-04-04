FROM directus/directus:latest
USER root
RUN npm install -g @directus/extensions-sdk
COPY tsconfig.build.json /directus
COPY DirectusExtensions/charging-stations-bundle/src /directus/extensions/directus-extension-charging-stations-bundle/src
COPY DirectusExtensions/charging-stations-bundle/package.json /directus/extensions/directus-extension-charging-stations-bundle/package.json
COPY DirectusExtensions/charging-stations-bundle/tsconfig.json /directus/extensions/directus-extension-charging-stations-bundle/tsconfig.json

RUN npm install --prefix /directus/extensions/directus-extension-charging-stations-bundle && npm run build --prefix /directus/extensions/directus-extension-charging-stations-bundle
USER node