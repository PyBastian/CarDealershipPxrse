import { expect, test } from "@playwright/test";

test("desktop catalog search, sort, detail and gallery", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/autos");
  await page.getByLabel("Buscar autos").fill("RAV4");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("Toyota RAV4").first()).toBeVisible();
  await page.getByLabel("Ordenar autos").last().selectOption("price-asc");
  await page.getByRole("link", { name: /Ver 2022 Toyota RAV4/ }).click();
  await expect(page.getByRole("link", { name: /Consultar por WhatsApp/ })).toBeVisible();
  await page.getByRole("button", { name: /Ver todas/ }).click();
  await expect(page.getByRole("button", { name: "Cerrar galería" })).toBeVisible();
});

test("mobile filters, vehicle detail and sticky CTA have no overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/autos");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("radio", { name: /Automática/ }).click();
  await page.getByRole("button", { name: /Ver \d+ autos/ }).click();
  await page.getByRole("link", { name: /Ver \d{4}/ }).first().click();
  await expect(page.locator(".mobile-sticky-cta")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
