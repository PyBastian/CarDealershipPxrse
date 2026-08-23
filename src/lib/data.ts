import { cache } from "react";
import { inventorySettings, inventoryVehicles } from "./inventory";
import { filterVehicles, isPublicStatus, type CatalogState } from "./catalog";
import type { Settings, Vehicle } from "./types";

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export const getSettings = cache(async (): Promise<Settings> => {
  if (!hasDatabase()) return inventorySettings;
  const { getPrisma } = await import("./prisma");
  const value = await getPrisma().globalSettings.findUnique({ where: { id: 1 } });
  return value ?? inventorySettings;
});

export async function getPublicVehicles(state?: CatalogState): Promise<Vehicle[]> {
  const settings = await getSettings();
  let vehicles: Vehicle[];
  if (!hasDatabase()) vehicles = inventoryVehicles;
  else {
    const { getPrisma } = await import("./prisma");
    vehicles = await getPrisma().vehicle.findMany({
      where: { deletedAt: null, status: { in: settings.showSold ? ["AVAILABLE", "RESERVED", "SOLD"] : ["AVAILABLE", "RESERVED"] } },
      include: { images: { orderBy: { sortOrder: "asc" } }, features: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }]
    }) as unknown as Vehicle[];
  }
  const visible = vehicles.filter((vehicle) => isPublicStatus(vehicle.status, settings.showSold));
  return filterVehicles(visible, state ?? { orden: "recommended" });
}

export const getVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  if (!hasDatabase()) return inventoryVehicles.find((vehicle) => vehicle.slug === slug && vehicle.status !== "DRAFT") ?? null;
  const { getPrisma } = await import("./prisma");
  return getPrisma().vehicle.findFirst({
    where: { slug, deletedAt: null, status: { not: "DRAFT" } },
    include: { images: { orderBy: { sortOrder: "asc" } }, features: true }
  }) as unknown as Vehicle | null;
});

export async function getAllPublicForSitemap() {
  if (!hasDatabase()) return inventoryVehicles.filter((v) => v.status !== "DRAFT");
  const { getPrisma } = await import("./prisma");
  return getPrisma().vehicle.findMany({ where: { deletedAt: null, status: { not: "DRAFT" } }, select: { slug: true, updatedAt: true } });
}

export async function getAdminVehicles() {
  if (!hasDatabase()) return inventoryVehicles;
  const { getPrisma } = await import("./prisma");
  return getPrisma().vehicle.findMany({ where: { deletedAt: null }, include: { images: { orderBy: { sortOrder: "asc" } }, features: true }, orderBy: { updatedAt: "desc" } }) as unknown as Vehicle[];
}
