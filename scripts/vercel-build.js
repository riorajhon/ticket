const { spawnSync } = require("child_process");

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
}

if (!process.env.DATABASE_URL) {
  console.error(
    "Missing DATABASE_URL. In Vercel: Storage → Neon/Postgres, or add DATABASE_URL in Settings → Environment Variables.",
  );
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error("Missing DIRECT_URL (and no DATABASE_URL to fall back to).");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["prisma", "generate", "&&", "npx", "prisma", "migrate", "deploy", "&&", "npx", "next", "build"],
  {
    stdio: "inherit",
    env: process.env,
    shell: true,
  },
);

process.exit(result.status ?? 1);
