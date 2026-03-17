# LearnDL Backend

Backend API for the LearnDL project. This service is built with Next.js App Router and provides:

- Firebase-authenticated user registration and session lookup
- PostgreSQL persistence through Prisma
- dataset and training session APIs
- presigned upload URLs for CSV datasets stored in DigitalOcean Spaces

## Stack

- Next.js 16
- TypeScript
- Prisma + PostgreSQL
- Firebase Admin SDK
- AWS SDK for S3-compatible object storage
- Docker / Docker Compose

## Project Structure

```text
learndl_backend/
|- app/api/                  API route handlers
|- lib/                      shared helpers such as Prisma and Firebase Admin
|- prisma/                   Prisma schema
|- public/                   static assets
|- Dockerfile                production image
|- docker-compose.yml        local container setup
|- .env.local                local runtime configuration
```

## Data Model

The backend currently stores three main entities:

- `User`: application user linked to a Firebase UID
- `Dataset`: uploaded CSV metadata and preview data
- `TrainingSession`: training runs associated with a dataset and user

The Prisma schema is defined in [schema.prisma](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\prisma\schema.prisma).

## Environment Variables

Create `learndl_backend/.env.local` and provide values for:

```env.local.example
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

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

- `FIREBASE_PRIVATE_KEY` must preserve newline characters. A common format is to store it with escaped `\n` values.
- For local Docker setup, this project expects PostgreSQL on `postgres:5432` inside containers.
- For local non-Docker development, the current project setup uses PostgreSQL on `localhost:5433`.

## Local Development

Install dependencies:

```bash
npm install
```

Start PostgreSQL with Docker:

```bash
docker compose up -d postgres
```

Apply the schema:

```bash
npx prisma generate
npx prisma migrate deploy
```

If there are no migrations yet, use:

```bash
npx prisma db push
```

If you update [schema.prisma](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\prisma\schema.prisma), run:

```bash
npx prisma generate
npx prisma db push
```

Run the backend in development mode:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Run With Docker Compose

To run PostgreSQL, apply the Prisma schema, and start the backend:

```bash
docker compose up --build
```

Services defined in [docker-compose.yml](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\docker-compose.yml):

- `postgres`: PostgreSQL 17 on port `5433`
- `migrate`: runs Prisma migration deploy, falling back to `db push`
- `backend`: production Next.js server on port `3000`

## Auth Flow

- The frontend signs users in with Firebase Authentication.
- The backend verifies Firebase ID tokens using Firebase Admin.
- After token verification, application user data is stored in PostgreSQL.
- If registration fails after Firebase authentication succeeds, the backend now rolls back the Firebase Auth user to avoid leaving an orphaned email record.

See [register route](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\app\api\auth\register\route.ts).

## API Overview

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Current user:

- `PUT /api/users/me`
- `GET /api/users/me`
- `DELETE /api/users/me/delete`
- `PATCH /api/users/me/password`

Datasets:

- `GET /api/users/:userId/datasets`
- `POST /api/users/:userId/datasets/upload`

Training sessions:

- `GET /api/users/:userId/training_sessions`
- `POST /api/users/:userId/training_sessions/start`

## Dataset Upload Flow

The upload flow is split into metadata creation and file upload:

1. The client calls `POST /api/users/:userId/datasets/upload`.
2. The backend creates a `Dataset` record and an initial `TrainingSession`.
3. The backend returns a presigned upload URL and a presigned download URL.
4. The client uploads the CSV directly to DigitalOcean Spaces using the returned URL.

This keeps file traffic out of the application server while still storing ownership and training metadata in PostgreSQL.

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npx prisma generate
npx prisma migrate deploy
npx prisma db push
```

## Known Requirements

- A running PostgreSQL database
- Firebase project credentials for Admin SDK access
- DigitalOcean Spaces credentials for dataset upload support
- Matching frontend Firebase configuration so issued ID tokens can be verified by this backend

## Related Files

- [firebase-admin.ts](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\lib\firebase-admin.ts)
- [schema.prisma](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\prisma\schema.prisma)
- [docker-compose.yml](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\docker-compose.yml)
- [Dockerfile](c:\Users\group\VsProject\ECE1724H_Advanced_Web\learndl_backend\Dockerfile)
