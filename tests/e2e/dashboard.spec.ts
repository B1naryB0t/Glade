import { test, expect } from "@playwright/test";

test("user sees feed and can create a post", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("tkuiper2024@gmail.com");
  await page.getByLabel("Password").fill("demo123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: /home feed/i })).toBeVisible();

  // Create a new post
  await page.getByPlaceholder("What's on your mind?").fill("Excited to test Glade!");
  await page.getByRole("button", { name: /post/i }).click();
  await expect(page.getByText("Excited to test Glade!")).toBeVisible();
});
