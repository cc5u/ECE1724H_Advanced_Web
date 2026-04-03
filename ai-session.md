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

---

## Session Title (e.g., Diagnosing unexpected UI behavior)

### Prompt (you sent to AI)

Why is `POST /api/auth/register` returning 500, and what should we change?

### AI Response (trimmed if long)

The failure was caused by Prisma schema drift and claimed the project had migrated from an integer `id` field to a UUID `user_id` field. It suggested that `prisma.user.create()` was using the wrong database shape and recommended updating the Prisma schema and auth route to match that assumed migration.

### What Your Team Did With It

- The response was useful as a debugging starting point because it focused attention on backend schema consistency and the registration route.
- A key limitation was that the AI presented an unverified root cause very confidently. In our project, the claimed `id INT` to `user_id UUID` migration was not established evidence, so part of the diagnosis was effectively a hallucinated assumption.
- Our team checked the actual Prisma schema, auth logic, and runtime behavior before making changes. We kept the parts that improved route consistency, but we rejected or revised the unsupported schema-migration claims and validated the final fix by confirming successful `200` responses instead of relying on the AI explanation alone.

---

## Session Title (e.g., Diagnosing unexpected UI behavior)

### Prompt (you sent to AI)

Why does the authentication flow still fail even after the backend route was updated?

### AI Response (trimmed if long)

The remaining issue was probably caused by frontend caching or a stale development server, and it recommended restarting the app, clearing cached state, and retrying the request before investigating deeper integration problems.

### What Your Team Did With It

- The advice was partly useful because restarting services and checking cached state are quick sanity checks during debugging.
- The limitation was that the AI defaulted to generic troubleshooting steps instead of tracing the actual request path and authentication contract. That made the answer sound reasonable, but it did not directly address the real integration issue.
- Our team verified the behavior by inspecting request headers, token handling, and backend validation logic. We treated the restart/cache advice as a low-priority check, then focused on the code-level auth flow and confirmed the fix with successful authenticated requests.
