# OHQ

## Project setup

You need to install the following:

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Bun](https://bun.sh/)

Then, you can install the dependencies:

```bash
bun install
```

Before you start developing, you need to create a `.env` file in the root of the project. You can copy the `.env.example` file and modify it to your needs. Just provide the necessary values following the instructions in the file.

## Running the app

Start the services:

```bash
docker-compose up
```

In a separate terminal, start the app itself:

```bash
bun dev
```

## Working on the DB

Our DB is fully managed by [Drizzle](https://orm.drizzle.team/), so the source of truth for the table schema should be the `app/services/db-schema.server.ts` file. Change it and run the following command to apply the changes:

```bash
bun run db:push
```

You can also directly interact with your dev DB by going to `localhost:8081`, where you can see a pgAdmin instance running. The credentials are the ones you provided in the `.env` file.
