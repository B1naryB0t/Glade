import { test, expect } from "@playwright/test";




test.describe("Authentication flow", () => {

    test("successful login", async ({ page }) => {
        await page.goto("http://localhost:3000/login");

        // Fill the email and password fields by their accessible names
        await page.getByLabel('Email address').fill('tkuiper2024@gmail.com');
        await page.getByLabel('Password').fill('demo123');

        // Click the Sign in button
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Verify navigation or heading
        await expect(page.getByRole('heading', { name: /home feed/i })).toBeVisible();
        });

    
    test("failed login", async ({ page }) => {
            test.fixme();
            await page.goto("http://localhost:3000/login");

            // Fill with invalid credentials
            await page.getByLabel('Email address').fill('wrong@example.com');
            await page.getByLabel('Password').fill('badpassword');

            // Click Sign in
            await page.getByRole('button', { name: 'Sign in' }).click();

            // Expect an error message to appear
            await expect(
            page.getByText(/invalid credentials|incorrect email|login failed/i)
            ).toBeVisible();

            // Ensure we are *still* on the login page (didn't navigate)
            await expect(page).toHaveURL(/\/login/);
        });

    test ("successful logout", async ({ page }) => {
        await page.goto("http://localhost:3000/login");
        await page.getByLabel('Email Address').fill('tkuiper2024@gmail.com');
        await page.getByLabel('Password').fill('demo123');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('heading', { name: /home feed/i })).toBeVisible();

        await page.getByRole('button', { name: /logout/i }).click();

        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('heading', { name: /sign in to glade/i })).toBeVisible();
        
    });
    
});
