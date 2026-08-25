import { expect, test, type Page } from "@playwright/test";

const car = {
  make: "Toyota", model: "RAV4", trim: "Limited AWD", year: 2022,
  price: 19990000, previousPrice: null, mileageKm: 42500,
  transmission: "AUTOMATIC", fuelType: "GASOLINE", drivetrain: "AWD", engine: "2.0 L",
  bodyType: "SUV", exteriorColor: "Grafito", interiorColor: null, doors: 5, seats: 5, horsepower: null,
  location: "Santiago, Región Metropolitana", status: "AVAILABLE",
  featured: true, newArrival: false, opportunity: false,
  description: "Vehículo de prueba.", highlights: [], publishedAt: "2026-08-20T12:00:00Z",
  images: [{ path: "/vehicles/suv-graphite.png", alt: "Toyota RAV4" }], features: []
};

const sha = "abc123sha";

async function mockGithub(page: Page) {
  const currentPrice = car.price;
  let currentImages = car.images;
  const commits: string[] = [];
  const json = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  const fileResponse = () => json({ sha, name: "car.json", path: `inventory/toyota-rav4-limited-awd-2022/car.json`, type: "file", encoding: "base64", content: Buffer.from(JSON.stringify({ ...car, price: currentPrice, images: currentImages })).toString("base64") });
  await page.route("**/api.github.com/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/repos/PyBastian/CarDealershipPxrse", "");
    const method = route.request().method();
    if (path === "" && method === "GET") return route.fulfill(json({ permissions: { pull: true, push: true } }));
    if (path === "/git/trees/main" && method === "GET") return route.fulfill(json({ tree: [{ path: "inventory/toyota-rav4-limited-awd-2022/car.json", type: "blob" }] }));
    if (path.startsWith("/contents/") && method === "GET") return route.fulfill(fileResponse());
    if (path.startsWith("/contents/") && method === "PUT") {
      const body = route.request().postDataJSON() as { message: string; content?: string };
      commits.push(body.message);
      if (body.content && path.endsWith("car.json")) currentImages = JSON.parse(Buffer.from(body.content, "base64").toString()).images;
      return route.fulfill(json({ content: { sha: "newsha" } }));
    }
    return route.fulfill({ status: 404, body: "{}" });
  });
  return { commits };
}

test("conexión con token y catálogo editable vía GitHub simulado", async ({ page }) => {
  const github = await mockGithub(page);
  await page.goto("/TheLastPalomin/inventario/");
  await expect(page.getByText("Administrador del catálogo")).toBeVisible();
  await page.getByLabel("GitHub Access Token").fill("github_pat_prueba");
  await page.getByRole("button", { name: "Conectar" }).click();
  await expect(page.getByRole("heading", { name: "Vehículos" })).toBeVisible();
  await expect(page.getByText("Toyota RAV4").first()).toBeVisible();
  await expect(page.getByText("GitHub conectado")).toBeAttached();

  await page.goto("/TheLastPalomin/");
  await expect(page.getByRole("heading", { name: "Tu concesionario, editable." })).toBeVisible();
  await expect(page.getByText("$19.990.000").first()).toBeVisible();

  await page.goto("/TheLastPalomin/autos/toyota-rav4-limited-awd-2022/");
  await expect(page.getByRole("heading", { name: "2022 Toyota RAV4" })).toBeVisible();
  await page.getByLabel("Precio (CLP)").fill("18990000");
  await page.getByRole("button", { name: /Guardar/ }).click();
  await expect(page.getByText(/Cambios guardados|reconstruyendo/i).first()).toBeVisible();
  expect(github.commits.some((message) => message.startsWith("admin: update Toyota RAV4"))).toBe(true);
  await page.locator(".dropzone input[type=file]").setInputFiles("public/vehicles/suv-graphite.png");
  await expect(page.locator(".palomin-photo-grid li.pending")).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator(".palomin-photo-grid li")).toHaveCount(2);
  expect(github.commits.some((message) => message.startsWith("admin: add photo to Toyota RAV4"))).toBe(true);
  expect(github.commits.some((message) => message.startsWith("admin: add photos to Toyota RAV4"))).toBe(true);

  await page.locator(".palomin-photo-open").first().click();
  const lightbox = page.locator(".palomin-lightbox");
  await expect(lightbox).toBeVisible();
  await expect(lightbox.getByText("1 / 2")).toBeVisible();
  await lightbox.getByLabel(/Texto alternativo/).fill("Toyota RAV4 vista frontal en estudio");
  await lightbox.getByRole("button", { name: "Guardar" }).click();
  await expect(lightbox).not.toBeVisible();
  expect(github.commits.some((message) => message.startsWith("admin: update photos of Toyota RAV4"))).toBe(true);
});
