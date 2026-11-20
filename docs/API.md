# API CONTRACT — source of truth (change this file FIRST, in its own PR)

Base URL: `NEXT_PUBLIC_API_URL` (dev: http://localhost:8000)
Auth: `Authorization: Bearer <supabase access_token>` on every `/api/*` route except `/health`.

## Endpoints
| Method | Path | Auth | Request | Response | Owner |
|---|---|---|---|---|---|
| GET | /health | no | – | `{ "ok": true }` | B |
| GET | /api/me | yes | – | `{ "id": uuid, "email": str }` | B |
| <!-- add --> | | | | | |

## Database tables (owner A writes the migration)
| Table | Columns | RLS |
|---|---|---|
| profiles | id uuid PK → auth.users, display_name text, created_at | user can read/update own row |
| <!-- add --> | | |

## Shared types
- TS: `web/lib/database.types.ts` (generated, don't edit by hand)
- Python: `api/app/schemas.py` (Pydantic, mirror this file)
