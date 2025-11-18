import { test, expect } from "@playwright/test";

test("displays unread notifications count", async ({ page }) => {
  await page.goto("/dashboard");
  const count = await page.getByTestId("notifications-count").textContent();
  expect(Number(count)).toBeGreaterThanOrEqual(0);
});
