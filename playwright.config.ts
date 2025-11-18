import { defineConfig , devices } from "@playwright/test";

export default defineConfig({
    testDir: ".tests/e2e", //backend ./src.   //frontend ./tests/e2e
    fullyParallel: true,
    workers: process.env.CI ? 2 : undefined,
    timeout: 30_000,
    retries: process.env.CI ? 2 : 0,
    use: {
        baseURL: process.env.E2E_BASE_URL || "http://localhost:3000/",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure"
    },
    //reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } }
        //{ name: "firefox", use: { ...devices["Desktop Firefox"] } }
        //{ name: "webkit", use: { ...devices["Desktop Safari"] } }
    ],
    webServer: process.env.E2E_START
    ? {
        command: process.env.E2E_START,
        url: process.env.E2E_URL || "http://localhost:3000",
        reuseExistingServer: !process.env.CI
    }
    : undefined
});

