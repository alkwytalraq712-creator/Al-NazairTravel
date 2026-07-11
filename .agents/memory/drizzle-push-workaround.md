---
name: drizzle-kit push TTY prompt workaround
description: What to do when `drizzle-kit push` hangs/prompts interactively in this project when adding new Drizzle tables.
---

`drizzle-kit push` (used by this project's normal schema-sync flow, no migration files) triggers an interactive TTY prompt about table/schema resolution when adding new tables/columns. It cannot be bypassed non-interactively here, even with `--force`.

**Why:** The prompt appears to ask about ambiguous table/schema resolution and blocks in a non-interactive shell with no way to answer it.

**How to apply:** Run `drizzle-kit generate` instead to produce the SQL DDL, extract only the new CREATE TABLE/ALTER/FK statements relevant to your change, and execute them directly via the SQL execution tool. Afterward, delete the generated migration folder (e.g. `lib/db/drizzle/`) since this project only uses `push`, not migration files — leaving it around would be inconsistent with the project's convention.
