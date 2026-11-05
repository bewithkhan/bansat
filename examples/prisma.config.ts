// prisma.config.ts (repo root) — Prisma 7+
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migrations need a direct (non-pooled) connection; the app uses a driver adapter at runtime.
  datasource: { url: env('DIRECT_URL') },
});
