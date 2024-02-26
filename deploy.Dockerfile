FROM node:18

WORKDIR /usr/local/apps/citrineos

COPY . .

RUN npm i && npm run build

# TODO remove src files

EXPOSE ${PORT}

CMD ["npm", "run", "start"]
