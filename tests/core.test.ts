import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { activeFilterCount, filterVehicles, isPublicStatus, parseCatalogState, relatedVehicles } from "@/lib/catalog";
import { carJsonSchema, serializeCarJson } from "@/lib/car-json";
import { withBasePath } from "@/lib/base-path";
import { bytesToBase64, decodeBase64 } from "@/lib/github-admin/client";
import { nextImageNumber } from "@/lib/github-admin/images";
import { vehicleName } from "@/lib/github-admin/vehicles";
import { inventoryVehicles } from "@/lib/inventory";
import { formatKm, formatPrice, labels, slugify } from "@/lib/format";
import { validateAdmin } from "@/lib/auth";
import { vehicleSchema } from "@/lib/vehicle-validation";

describe("formato chileno", () => {
  it("formatea CLP y kilometraje sin decimales", () => { expect(formatPrice(18490000)).toBe("$18.490.000"); expect(formatKm(42500)).toBe("42.500 km"); });
  it("crea slugs sin acentos", () => expect(slugify("Peugeot 3008 Allure Diésel 2020")).toBe("peugeot-3008-allure-diesel-2020"));
});

describe("catálogo", () => {
  it("ignora valores de URL inválidos", () => { const state = parseCatalogState({ precioMax: "no", transmision: "CVT", orden: "wat" }); expect(state).toEqual({ orden: "recommended" }); });
  it("combina búsqueda, marca, precio y transmisión", () => { const state = parseCatalogState({ q: "rav4 2022", marca: "Toyota", transmision: "AUTOMATIC", precioMax: "20000000" }); expect(filterVehicles(inventoryVehicles, state).map((v) => v.model)).toEqual(["RAV4"]); expect(activeFilterCount(state)).toBe(4); });
  it("ordena por precio", () => { const state = parseCatalogState({ orden: "price-asc" }); const result = filterVehicles(inventoryVehicles, state); expect(result[0].model).toBe("Swift"); expect(result.at(-1)?.model).toBe("Ranger"); });
  it("aplica visibilidad por estado", () => { expect(isPublicStatus("AVAILABLE")).toBe(true); expect(isPublicStatus("RESERVED")).toBe(true); expect(isPublicStatus("SOLD")).toBe(false); expect(isPublicStatus("SOLD", true)).toBe(true); expect(isPublicStatus("DRAFT", true)).toBe(false); });
  it("elige relacionados sin incluir el actual", () => { const current = inventoryVehicles.find((vehicle) => vehicle.make === "Toyota")!; const result = relatedVehicles(current, inventoryVehicles); expect(result).toHaveLength(4); expect(result.some((v) => v.id === current.id)).toBe(false); expect(result[0].bodyType).toBe("SUV"); });
});

describe("límites de confianza", () => {
  it("valida un vehículo", () => { const input = { make: "Toyota", model: "RAV4", trim: "", year: "2022", price: "19990000", previousPrice: "", mileageKm: "42500", transmission: "AUTOMATIC", fuelType: "GASOLINE", drivetrain: "AWD", engine: "2.0", bodyType: "SUV", exteriorColor: "Gris", interiorColor: "Negro", doors: "5", seats: "5", horsepower: "", location: "Santiago", status: "AVAILABLE", description: "", internalNotes: "" }; expect(vehicleSchema.parse(input).price).toBe(19990000); expect(() => vehicleSchema.parse({ ...input, year: "1800" })).toThrow(); });
  it("autoriza solo las credenciales configuradas", async () => { process.env.ADMIN_EMAIL = "admin@demo.cl"; process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash("correcta", 4); expect(await validateAdmin("admin@demo.cl", "correcta")).toBe(true); expect(await validateAdmin("admin@demo.cl", "incorrecta")).toBe(false); delete process.env.ADMIN_EMAIL; delete process.env.ADMIN_PASSWORD_HASH; });
});

describe("car.json", () => {
  const base = { make: "Toyota", model: "Corolla", trim: "GR Sport", year: 2024, price: 15990000, mileageKm: 0, transmission: "MANUAL" as const, fuelType: "GASOLINE" as const, bodyType: "SEDAN" as const, location: "Santiago", status: "AVAILABLE" as const, featured: false, newArrival: false, opportunity: false };
  it("serializa JSON limpio sin nulos y con publishedAt", () => {
    const text = serializeCarJson({ ...base, previousPrice: null, drivetrain: null, highlights: ["Garantía"], images: [{ path: "/vehicles/a.webp", alt: "A" }], features: [], publishedAt: null }, "");
    const value = JSON.parse(text);
    expect(value.previousPrice).toBeUndefined();
    expect(value.drivetrain).toBeUndefined();
    expect(value.publishedAt).toBeTruthy();
    expect(value.images[0].path).toBe("/vehicles/a.webp");
    expect(text.endsWith("\n")).toBe(true);
  });
  it("quita el base path de las imágenes al serializar", () => {
    const text = serializeCarJson({ ...base, highlights: [], images: [{ path: "/CarDealershipPxrse/vehicles/x.webp", alt: "X" }], features: [] }, "/CarDealershipPxrse");
    expect(JSON.parse(text).images[0].path).toBe("/vehicles/x.webp");
  });
  it("publica borrador sin fecha y valida el schema compartido", () => {
    const text = serializeCarJson({ ...base, status: "DRAFT", highlights: [], images: [], features: [] }, "");
    const parsed = carJsonSchema.parse(JSON.parse(text));
    expect(parsed.publishedAt ?? null).toBeNull();
  });
});

describe("github-admin", () => {
  const base = { make: "Toyota", model: "Corolla", trim: null, year: 2024, price: 15990000, mileageKm: 0, transmission: "MANUAL" as const, fuelType: "GASOLINE" as const, bodyType: "SEDAN" as const, location: "Santiago", status: "AVAILABLE" as const, featured: false, newArrival: false, opportunity: false };
  it("codifica y decodifica contenido en base64 por bloques", () => {
    const text = "Hola ñandú 🚗 ".repeat(9000);
    expect(decodeBase64(bytesToBase64(new TextEncoder().encode(text)))).toBe(text);
  });
  it("decodifica respuestas del Contents API con saltos de línea", () => {
    expect(decodeBase64(Buffer.from('{"ok":true}').toString("base64").replace(/(.{4})/g, "$1\n"))).toBe('{"ok":true}');
  });
  it("genera nombres secuenciales para fotos nuevas", () => {
    expect(nextImageNumber([], "slug")).toBe(1);
    expect(nextImageNumber([{ path: "/vehicles/slug/01.webp" }, { path: "/vehicles/slug/04.webp" }], "slug")).toBe(5);
    expect(nextImageNumber([{ path: "/vehicles/otro/09.webp" }], "slug")).toBe(1);
  });
  it("arma el nombre legible del vehículo", () => {
    expect(vehicleName(carJsonSchema.parse({ ...base, highlights: [], images: [], features: [], publishedAt: null }))).toBe("Toyota Corolla 2024");
  });
});

describe("estados y rutas", () => {
  it("mapea estados al español", () => {
    expect(labels.status.AVAILABLE).toBe("Disponible");
    expect(labels.status.RESERVED).toBe("Reservado");
    expect(labels.status.SOLD).toBe("Vendido");
    expect(labels.status.DRAFT).toBe("Borrador");
  });
  it("respeta el base path configurado", () => {
    const original = process.env.NEXT_PUBLIC_BASE_PATH;
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    expect(withBasePath("/autos")).toBe("/autos");
    if (original !== undefined) process.env.NEXT_PUBLIC_BASE_PATH = original;
  });
});

describe("token storage", () => {
  it("guarda, lee y borra el token del navegador", async () => {
    const store = new Map<string, string>();
    (globalThis as Record<string, unknown>).localStorage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value), removeItem: (key: string) => void store.delete(key) };
    const storage = await import("@/lib/github-admin/storage");
    expect(storage.readStoredToken()).toBeNull();
    storage.storeToken("github_pat_test");
    expect(storage.readStoredToken()).toBe("github_pat_test");
    expect(store.get("palomin-github-token:v1")).toBe("github_pat_test");
    storage.clearStoredToken();
    expect(storage.readStoredToken()).toBeNull();
  });
});
