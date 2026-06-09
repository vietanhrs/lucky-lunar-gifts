import { test, expect } from "@playwright/test";
import { makeGiftCode } from "./helpers";

test.describe("Claim page", () => {
  test("renders the scrambled puzzle from the gift code", async ({ page }) => {
    const code = makeGiftCode({ hint: ["l", "u", "c", "k", "y"] });
    await page.goto(`/claim?code=${code}`);

    await expect(
      page.getByRole("heading", { name: /Claim Your Lucky ADA/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Guess the Secret Word", { exact: false }),
    ).toBeVisible();
    // The hint is rendered as "/l/u/c/k/y" (order as provided in the code).
    await expect(page.getByText("/l/u/c/k/y")).toBeVisible();
  });

  test("requires a connected wallet before claiming", async ({ page }) => {
    const code = makeGiftCode({ hint: ["t", "e", "t"] });
    await page.goto(`/claim?code=${code}`);

    await expect(page.getByText(/Connect a wallet/i)).toBeVisible();
    // No CIP-30 wallet in a headless browser → claim is disabled.
    await expect(page.getByRole("button", { name: /Claim Gift/i })).toBeDisabled();
  });
});
