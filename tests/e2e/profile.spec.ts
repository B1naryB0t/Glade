import { test, expect } from "@playwright/test";


test("user can navigate to their profile", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: /profile/i }).click();
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByRole("heading", { name: /tamara/i })).toBeVisible();
});
