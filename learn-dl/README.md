# LearnDL Fullstack App

This directory now contains the merged LearnDL web application:

- frontend UI
- backend API routes
- Prisma/PostgreSQL integration
- Firebase client auth and Firebase Admin verification
- file upload orchestration for DigitalOcean Spaces

The app is built with Next.js App Router, so `learndl_backend` is no longer "just the backend". It is the main web app for the project.

## What Lives Where

The overall system now looks like this:

```text
Browser
  -> Next.js fullstack app (this directory)
      -> React UI pages
      -> /api/* route handlers
      -> Prisma -> PostgreSQL
      -> Firebase Admin
      -> DigitalOcean Spaces
      -> ML backend (separate service in ../ml_backend)
```

That means:

- this folder serves both frontend and backend
- PostgreSQL is still a separate service
- `ml_backend` is still a separate service

## Recommended Rename

Because this folder is now the full web app, a clearer long-term name would be one of:

- `learndl_app`
- `learndl_web`
- `learndl_fullstack`

I did not rename the directory automatically because that would also require updating:

- Docker paths
- IDE workspace references
- repo documentation
- any scripts or external tooling pointing at `learndl_backend`

## Project Structure

```text
learndl_backend/
|- app/                       Next.js App Router entrypoints and API routes
|- app/(dashboard)/           Authenticated app pages
|- app/api/                   Backend API route handlers
|- src/screens/               Migrated UI screens
|- src/components/            Reusable client-side components
|- src/auth/                  Firebase client auth helpers and providers
|- src/api/                   Browser API clients
|- src/training/              Training runtime state/polling
|- lib/                       Server-side helpers (Prisma, Firebase Admin, Spaces)
|- prisma/                    Prisma schema and migrations
|- public/                    Static assets
|- Dockerfile                 Fullstack Next.js container build
|- docker-compose.yml         Postgres + migrations + fullstack app
|- .env.local                 Local runtime configuration
```

## Environment Variables

Create `learndl_backend/.env.local`.

### Frontend / Browser

These are used in client-side code and are required for Firebase Auth:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Optional browser/runtime variables:

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ML_API_URL=http://localhost:8000/model_api

NEXT_PUBLIC_IMDB_DATASET_URL=
NEXT_PUBLIC_SMS_DATASET_URL=
NEXT_PUBLIC_AGNEWS_DATASET_URL=
```

Notes:

- `NEXT_PUBLIC_API_URL=/api` is usually the safest local setting.
- `NEXT_PUBLIC_ML_API_URL` points to the separate ML service.
- the dataset URL variables are used for built-in dataset preview loading in the training screen.

### Backend / Server

These are used only on the server:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

DATABASE_URL=

AUTH_SECRET=

SPACES_KEY=
SPACES_SECRET=
SPACES_BUCKET=
```

Notes:

- `FIREBASE_PRIVATE_KEY` should preserve escaped newlines like `\n`.
- `DATABASE_URL` should point to your Postgres instance.

## Database Port

In the current Docker Compose setup, PostgreSQL is exposed on:

```text
localhost:5432
```

So local development should typically use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learndl_db?schema=public
```

Inside Docker containers, the app uses:

```text
postgres:5432
```

## Local Development

This is the simplest workflow when actively editing the Next.js app.

### 1. Start Postgres only

```bash
docker compose up -d postgres
```

### 2. Install dependencies

```bash
npm install
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Apply schema

```bash
npx prisma migrate deploy
```

If there are no migrations or you are syncing schema quickly in development:

```bash
npx prisma db push
```

### 5. Run the fullstack app locally

```bash
npm run dev
```

The app will usually be available at:

- `http://localhost:3000`
- or another port if `3000` is already occupied

## Full Docker Run

If you want to run the web app and database together in Docker:

```bash
docker compose up --build
```

This starts:

- `postgres`
- `migrate`
- `backend`

Important:

- this `backend` service is the fullstack Next.js app
- it serves both the frontend and backend API
- changing `NEXT_PUBLIC_*` values requires rebuilding the image because the browser bundle is built at image build time

## ML Backend

The ML service is still separate and lives in `../ml_backend`.

Start it separately if you want training and prediction features to work.

Without the ML backend:

- login/auth can still work
- database-backed pages can still work
- training/prediction requests will fail

## Common Workflows

### Workflow A: edit app locally

Use this when you are changing React pages or API routes in this repo.

```text
docker compose up -d postgres
run ml_backend separately if needed
npm run dev
```

### Workflow B: run app from Docker

Use this when you want the Next app itself containerized.

```text
docker compose up --build
run ml_backend separately if needed
open http://localhost:3000
```

Do not run both the Dockerized web app and local `npm run dev` unless you intentionally want two different app servers.

## Auth Flow

1. The browser signs in with Firebase Authentication.
2. The browser gets a Firebase ID token.
3. The frontend calls Next API routes such as `/api/auth/register` or `/api/auth/me`.
4. The Next server verifies the token with Firebase Admin.
5. The Next server syncs/fetches the application user in PostgreSQL through Prisma.

## Data Flow

### User and metadata

```text
Browser -> Next API -> Prisma -> PostgreSQL
```

### File upload

```text
Browser -> Next API -> presigned URL
Browser -> DigitalOcean Spaces
```

### Training / prediction

```text
Browser -> Next API / client helpers -> ML backend
```

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint

npx prisma generate
npx prisma migrate deploy
npx prisma db push

docker compose up -d postgres
docker compose up --build
docker compose down
docker compose down -v
```

## Common Errors

### `Firebase: Error (auth/invalid-api-key)`

Usually means one of these:

- wrong `NEXT_PUBLIC_FIREBASE_*` values
- stale local dev server after env changes
- Docker image not rebuilt after changing `NEXT_PUBLIC_*` values

### Prisma `Invalid invocation`

Often caused by:

- bad `DATABASE_URL`
- wrong DB password
- Postgres not running
- schema not applied yet

### `500 /api/auth/register`

Usually means the request reached the backend, but one of these failed:

- Firebase Admin verification
- Prisma database access
- user sync query

## Related Files

- `app/api/auth/register/route.ts`
- `lib/auth.ts`
- `lib/firebase-admin.ts`
- `lib/prisma.ts`
- `prisma/schema.prisma`
- `docker-compose.yml`
- `Dockerfile`
