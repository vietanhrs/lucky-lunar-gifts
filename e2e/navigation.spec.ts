import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header links move between pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "My Gifts" }).click();
    await expect(page).toHaveURL(/\/my-gifts$/);
    await expect(page.getByRole("heading", { name: /My Gifts/i })).toBeVisible();

    await page.getByRole("link", { name: "Create" }).click();
    await expect(page).toHaveURL(/\/create$/);

    await page.getByRole("link", { name: /Lucky ADA/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("create page prompts to connect a wallet", async ({ page }) => {
    await page.goto("/create");
    await expect(page.getByRole("button", { name: /Connect Wallet/i })).toBeVisible();
  });
});
