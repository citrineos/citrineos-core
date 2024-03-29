FROM node:18

WORKDIR /usr/local/apps/citrineos

COPY ../ .

RUN npm i && npm run build

# TODO remove src files

EXPOSE ${PORT}

WORKDIR /usr/local/apps/citrineos/Server

CMD ["npm", "run", "start"]
