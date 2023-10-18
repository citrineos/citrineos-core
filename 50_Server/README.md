# Docker setup

You need to install
[docker](https://docs.docker.com/engine/install/#server) and
[docker-compose](https://docs.docker.com/compose/install/#install-compose)).
Furthermore, [Visual Studio
Code](https://code.visualstudio.com/docs/setup/linux) might be handy as
a common integrated development environment.

Open a shell in sub-directory `100_Docker` and
run (might take while for the first run):

    docker-compose up -d

Now, the following services should be running:

-   **RabbitMQ Broker** (service name: amqp-broker) with ports
    -   `5672`: amqp tcp connection
    -   `15672`: RabbitMQ [management interface](http://localhost:15672)
-   **PostgreSQL** (service name: ocpp-db), PostgreSQL database for persistence
    -   `5432`: sql tcp connection
-   **Directus** (service name: directus) on port 8055 with endpoints
    -   `:8055/admin`: web interface (login = admin@citrineos.com:CitrineOS!)

These three services are defined in `50_Server/docker-compose.yml` and they
live inside the docker network `docker_default` with their respective
ports. By default these ports are directly accessible by using
`localhost:8055` for example.

So, if you want to access the **amqp-broker** default management port via your
localhost, you need to access `localhost:15672`.
