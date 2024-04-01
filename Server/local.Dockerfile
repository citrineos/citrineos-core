FROM node:18

WORKDIR /usr/local/apps/citrineos

COPY .. .

RUN npm run clean && npm run install-all && npm run build

EXPOSE ${PORT}

WORKDIR /usr/local/apps/citrineos/Server

CMD ["npm", "run", "start:local-docker"]
