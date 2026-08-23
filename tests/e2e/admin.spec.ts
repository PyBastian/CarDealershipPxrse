import { expect, test } from "@playwright/test";

test("admin login, publish and sold visibility", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop" || !process.env.ADMIN_TEST_PASSWORD || !process.env.ADMIN_EMAIL, "Requiere credenciales efímeras de prueba");
  const model = `Prueba ${Date.now()}`;
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("Contraseña").fill(process.env.ADMIN_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await page.goto("/admin/autos/nuevo");
  await page.getByLabel("Marca").fill("NOVA");
  await page.getByLabel("Modelo").fill(model);
  await page.getByLabel("Precio", { exact: true }).fill("12340000");
  await page.getByLabel("Kilometraje").fill("12000");
  await page.getByLabel("Estado").selectOption("AVAILABLE");
  await page.getByLabel(/Arrastra o selecciona fotos/).setInputFiles("public/vehicles/suv-graphite.png");
  await page.getByRole("button", { name: "Guardar auto" }).click();
  await expect(page.getByText(model).first()).toBeVisible();
  await page.goto(`/autos?q=${encodeURIComponent(model)}`);
  await expect(page.getByRole("link", { name: new RegExp(`Ver \\d{4} NOVA ${model}`) })).toBeVisible();
  await page.goto("/admin/autos");
  await page.getByText(model).first().click();
  await page.getByRole("button", { name: "Marcar vendido" }).click();
  await expect(page.getByLabel("Estado")).toHaveValue("SOLD");
  await page.goto(`/autos?q=${encodeURIComponent(model)}`);
  await expect(page.getByText("No encontramos autos con estos filtros.")).toBeVisible();
});
