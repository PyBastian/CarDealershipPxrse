import { cache } from "react";
import { demoSettings, demoVehicles } from "./demo";
import { filterVehicles, isPublicStatus, type CatalogState } from "./catalog";
import type { Settings, Vehicle } from "./types";

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export const getSettings = cache(async (): Promise<Settings> => {
  if (!hasDatabase()) return demoSettings;
  const { getPrisma } = await import("./prisma");
  const value = await getPrisma().globalSettings.findUnique({ where: { id: 1 } });
  return value ?? demoSettings;
});

export async function getPublicVehicles(state?: CatalogState): Promise<Vehicle[]> {
  const settings = await getSettings();
  let vehicles: Vehicle[];
  if (!hasDatabase()) vehicles = demoVehicles;
  else {
    const { getPrisma } = await import("./prisma");
    vehicles = await getPrisma().vehicle.findMany({
      where: { deletedAt: null, status: { in: settings.showSold ? ["AVAILABLE", "RESERVED", "SOLD"] : ["AVAILABLE", "RESERVED"] } },
      include: { images: { orderBy: { sortOrder: "asc" } }, features: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }]
    }) as unknown as Vehicle[];
  }
  const visible = vehicles.filter((vehicle) => isPublicStatus(vehicle.status, settings.showSold));
  return state ? filterVehicles(visible, state) : visible;
}

export const getVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  if (!hasDatabase()) return demoVehicles.find((vehicle) => vehicle.slug === slug && vehicle.status !== "DRAFT") ?? null;
  const { getPrisma } = await import("./prisma");
  return getPrisma().vehicle.findFirst({
    where: { slug, deletedAt: null, status: { not: "DRAFT" } },
    include: { images: { orderBy: { sortOrder: "asc" } }, features: true }
  }) as unknown as Vehicle | null;
});

export async function getAllPublicForSitemap() {
  if (!hasDatabase()) return demoVehicles.filter((v) => v.status !== "DRAFT");
  const { getPrisma } = await import("./prisma");
  return getPrisma().vehicle.findMany({ where: { deletedAt: null, status: { not: "DRAFT" } }, select: { slug: true, updatedAt: true } });
}

export async function getAdminVehicles() {
  if (!hasDatabase()) return demoVehicles;
  const { getPrisma } = await import("./prisma");
  return getPrisma().vehicle.findMany({ where: { deletedAt: null }, include: { images: { orderBy: { sortOrder: "asc" } }, features: true }, orderBy: { updatedAt: "desc" } }) as unknown as Vehicle[];
}
