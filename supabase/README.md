# Supabase Workspace

This directory stores the database source of truth for `lmu-web`:

- `migrations/`: schema changes, RLS policies, helper functions, and indexes
- `seed.sql`: base catalog data for manufacturers, car classes, cars, and tracks

The initial multi-user domain for ApexSetup lives in the first migration and includes:

- user profiles linked to `auth.users`
- teams and team memberships
- setups with ownership and visibility
- per-user setup favorites
- row-level security for private, team-shared, and public access

When the Supabase CLI is configured locally, apply the schema and seeds from this directory instead
of treating the dashboard as the source of truth.
