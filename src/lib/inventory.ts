import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Settings, Vehicle } from "./types";

const inventoryDirectory = path.join(process.cwd(), "inventory");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const imageSchema = z.object({ path: z.string().startsWith("/"), alt: z.string().min(1) });
const featureSchema = z.object({ category: z.string().min(1), label: z.string().min(1), value: z.string().optional() });
const carSchema = z.object({
  make: z.string().min(1), model: z.string().min(1), trim: z.string().nullable().optional(),
  year: z.number().int().min(1900), price: z.number().int().nonnegative(), previousPrice: z.number().int().nonnegative().nullable().optional(),
  mileageKm: z.number().int().nonnegative(), transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  fuelType: z.enum(["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC", "OTHER"]),
  drivetrain: z.string().nullable().optional(), engine: z.string().nullable().optional(),
  bodyType: z.enum(["SUV", "SEDAN", "HATCHBACK", "PICKUP", "WAGON", "COUPE", "VAN", "OTHER"]),
  exteriorColor: z.string().nullable().optional(), interiorColor: z.string().nullable().optional(),
  doors: z.number().int().positive().nullable().optional(), seats: z.number().int().positive().nullable().optional(), horsepower: z.number().int().positive().nullable().optional(),
  location: z.string().min(1), status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "DRAFT"]),
  featured: z.boolean().default(false), newArrival: z.boolean().default(false), opportunity: z.boolean().default(false),
  description: z.string().nullable().optional(), highlights: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().nullable().optional(), images: z.array(imageSchema).default([]), features: z.array(featureSchema).default([])
});

function readJson(file: string) {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { throw new Error(`No se pudo leer ${path.relative(process.cwd(), file)}: ${error instanceof Error ? error.message : error}`); }
}

export const inventorySettings = readJson(path.join(inventoryDirectory, "settings.json")) as Settings;

export const inventoryVehicles: Vehicle[] = readdirSync(inventoryDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const slug = entry.name;
    const car = carSchema.parse(readJson(path.join(inventoryDirectory, slug, "car.json")));
    const date = car.publishedAt ?? "2026-08-20T12:00:00Z";
    return {
      id: slug, slug, ...car, createdAt: date, updatedAt: date, deletedAt: null,
      images: car.images.map((image, index) => ({ id: `${slug}-image-${index + 1}`, url: `${basePath}${image.path}`, alt: image.alt, sortOrder: index, isCover: index === 0 })),
      features: car.features.map((feature, index) => ({ id: `${slug}-feature-${index + 1}`, ...feature }))
    };
  });
