import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = process.env.SUPABASE_TEST_PROJECT_REF;
const productionRef = process.env.SUPABASE_PRODUCTION_PROJECT_REF;

if (process.env.SUPABASE_ENVIRONMENT !== "development") {
  throw new Error("E2E tests are allowed only with SUPABASE_ENVIRONMENT=development.");
}

if (!projectUrl || !projectRef || !productionRef || projectRef === productionRef) {
  throw new Error("Set development and production Supabase project references before E2E tests.");
}

if ([
  process.env.SUPABASE_TEST_ADMIN_EMAIL,
  process.env.SUPABASE_TEST_ADMIN_PASSWORD,
  process.env.SUPABASE_TEST_MEMBER_EMAIL,
  process.env.SUPABASE_TEST_MEMBER_PASSWORD,
].some((value) => !value)) {
  throw new Error("E2E tests require dedicated development administrator and non-admin accounts.");
}

if (new URL(projectUrl).hostname !== `${projectRef}.supabase.co`) {
  throw new Error("The Supabase URL does not match SUPABASE_TEST_PROJECT_REF.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});