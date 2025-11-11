import { test, expect } from "@playwright/test";

test ("home page loads", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.getByRole('heading', { name: 'Sign in to Glade' })).toBeVisible();
});