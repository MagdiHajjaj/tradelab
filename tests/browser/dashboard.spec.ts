import { expect, test } from "@playwright/test";

test("paper orders update holdings and a resting order can be cancelled", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Buy AAPL", exact: true }).click();
  await expect(page.getByText("10 shares", { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Filled");
  await page.getByLabel("Order type").selectOption("limit");
  await page.getByLabel("Limit price").fill("1.00");
  await page.getByRole("button", { name: "Buy AAPL", exact: true }).click();
  await page.getByRole("button", { name: "Open orders", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("No resting orders", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("tradelab-paper-orders.csv");
});

test("navigation, market search and mobile layout work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Markets", exact: true }).click();
  await page.getByRole("textbox", { name: "Search markets" }).fill("nvda");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Trade", exact: true }).click();
  await expect(page.getByRole("button", { name: "Buy NVDA", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Architecture", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Understand every layer." })).toBeVisible();
});
