FROM node:18

WORKDIR /usr/local/apps/citrineos

COPY . .

RUN npm run install-all && npm run build

EXPOSE ${PORT}

CMD ["npm", "run", "start:local-docker"]
