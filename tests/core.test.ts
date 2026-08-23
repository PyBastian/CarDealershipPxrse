import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { activeFilterCount, filterVehicles, isPublicStatus, parseCatalogState, relatedVehicles } from "@/lib/catalog";
import { demoVehicles } from "@/lib/demo";
import { formatKm, formatPrice, slugify } from "@/lib/format";
import { validateAdmin } from "@/lib/auth";
import { vehicleSchema } from "@/lib/vehicle-validation";

describe("formato chileno", () => {
  it("formatea CLP y kilometraje sin decimales", () => { expect(formatPrice(18490000)).toBe("$18.490.000"); expect(formatKm(42500)).toBe("42.500 km"); });
  it("crea slugs sin acentos", () => expect(slugify("Peugeot 3008 Allure Diésel 2020")).toBe("peugeot-3008-allure-diesel-2020"));
});

describe("catálogo", () => {
  it("ignora valores de URL inválidos", () => { const state = parseCatalogState({ precioMax: "no", transmision: "CVT", orden: "wat" }); expect(state).toEqual({ orden: "recommended" }); });
  it("combina búsqueda, marca, precio y transmisión", () => { const state = parseCatalogState({ q: "rav4 2022", marca: "Toyota", transmision: "AUTOMATIC", precioMax: "20000000" }); expect(filterVehicles(demoVehicles, state).map((v) => v.model)).toEqual(["RAV4"]); expect(activeFilterCount(state)).toBe(4); });
  it("ordena por precio", () => { const state = parseCatalogState({ orden: "price-asc" }); const result = filterVehicles(demoVehicles, state); expect(result[0].model).toBe("Swift"); expect(result.at(-1)?.model).toBe("Ranger"); });
  it("aplica visibilidad por estado", () => { expect(isPublicStatus("AVAILABLE")).toBe(true); expect(isPublicStatus("RESERVED")).toBe(true); expect(isPublicStatus("SOLD")).toBe(false); expect(isPublicStatus("SOLD", true)).toBe(true); expect(isPublicStatus("DRAFT", true)).toBe(false); });
  it("elige relacionados sin incluir el actual", () => { const current = demoVehicles[0]; const result = relatedVehicles(current, demoVehicles); expect(result).toHaveLength(4); expect(result.some((v) => v.id === current.id)).toBe(false); expect(result[0].bodyType).toBe("SUV"); });
});

describe("límites de confianza", () => {
  it("valida un vehículo", () => { const input = { make: "Toyota", model: "RAV4", trim: "", year: "2022", price: "19990000", previousPrice: "", mileageKm: "42500", transmission: "AUTOMATIC", fuelType: "GASOLINE", drivetrain: "AWD", engine: "2.0", bodyType: "SUV", exteriorColor: "Gris", interiorColor: "Negro", doors: "5", seats: "5", horsepower: "", location: "Santiago", status: "AVAILABLE", description: "", internalNotes: "" }; expect(vehicleSchema.parse(input).price).toBe(19990000); expect(() => vehicleSchema.parse({ ...input, year: "1800" })).toThrow(); });
  it("autoriza solo las credenciales configuradas", async () => { process.env.ADMIN_EMAIL = "admin@demo.cl"; process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash("correcta", 4); expect(await validateAdmin("admin@demo.cl", "correcta")).toBe(true); expect(await validateAdmin("admin@demo.cl", "incorrecta")).toBe(false); delete process.env.ADMIN_EMAIL; delete process.env.ADMIN_PASSWORD_HASH; });
});
