FROM node:18 as build

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN npm run install-all && npm run build
RUN npm rebuild bcrypt --build-from-source && npm rebuild deasync --build-from-source

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:18-slim
COPY --from=build /usr/local/apps/citrineos /usr/local/apps/citrineos

WORKDIR /usr/local/apps/citrineos

EXPOSE ${PORT}

CMD ["npm", "run", "start-docker"]
