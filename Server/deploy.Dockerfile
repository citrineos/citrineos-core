FROM node:22 as build

WORKDIR /usr/local/apps/citrineos

COPY . .
RUN npm run install-all && npm run build

# The final stage, which copies built files and prepares the run environment
# Using a slim image to reduce the final image size
FROM node:22-slim
COPY --from=build /usr/local/apps/citrineos /usr/local/apps/citrineos

WORKDIR /usr/local/apps/citrineos

EXPOSE ${PORT}

CMD ["npm", "run", "start-docker-cloud"]
