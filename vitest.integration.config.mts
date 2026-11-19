import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);
const nextEnv = require("@next/env") as typeof import("@next/env");
nextEnv.loadEnvConfig(process.cwd());

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = process.env.SUPABASE_TEST_PROJECT_REF;
const productionRef = process.env.SUPABASE_PRODUCTION_PROJECT_REF;

if (process.env.SUPABASE_ENVIRONMENT !== "development") {
  throw new Error("Integration tests are allowed only with SUPABASE_ENVIRONMENT=development.");
}

if (process.env.SUPABASE_ALLOW_DEVELOPMENT_TEST_WRITES !== "1") {
  throw new Error("Set SUPABASE_ALLOW_DEVELOPMENT_TEST_WRITES=1 to confirm disposable development data.");
}

if (!projectUrl || !projectRef || !productionRef || projectRef === productionRef) {
  throw new Error("Set development and production Supabase project references before integration tests.");
}

if (new URL(projectUrl).hostname !== `${projectRef}.supabase.co`) {
  throw new Error("The Supabase URL does not match SUPABASE_TEST_PROJECT_REF.");
}

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});