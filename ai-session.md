## Session Title
Fix Error 500 on /api/auth/register

### Prompt
C:3000/api/auth/register:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)

### AI Response (trimmed if long)

The 500 on POST /api/auth/register was caused by Prisma schema drift. Your database migration changed users from id INT to user_id UUID, but schema.prisma was still using the old model, so prisma.user.create() was generating inserts for the wrong shape.
I fixed the backend to match the migrated schema in schema.prisma, regenerated the Prisma client, and updated route.ts to use UUID userId plus datasetId / csvName instead of the removed integer/old column fields. I also removed a stray debug log in route.ts and cleaned unused imports in the auth routes.
Verification: npx prisma generate succeeded and npm run lint is clean.
Next step: restart the Next.js backend dev server if it was already running, then retry registration on http://localhost:3000/api/auth/register.

### What Your Team Did With It

- Aligning route.ts with Firebase auth + Prisma (firebaseUid, bearer token verification) improved consistency
- Some old schema assumptions did not fully match our implementation
- Updated auth flow, handled 404 properly, used userId for operations, and verified with successful 200 responses
