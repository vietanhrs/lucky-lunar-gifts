import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("shows the hero, create button and claim form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Lucky ADA/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Gift/i })).toBeVisible();
    await expect(page.getByPlaceholder("Enter gift code...")).toBeVisible();
  });

  test("navigates to the create page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Create Gift/i }).click();
    await expect(page).toHaveURL(/\/create$/);
    await expect(
      page.getByRole("heading", { name: /Create a Lucky Gift/i }),
    ).toBeVisible();
  });

  test("routes a typed gift code to the claim page", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Enter gift code...").fill("some-code-123");
    await page.getByPlaceholder("Enter gift code...").press("Enter");
    await expect(page).toHaveURL(/\/claim\?code=some-code-123/);
  });
});
