import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Settings, Vehicle } from "./types";
import { carJsonSchema } from "./car-json";

const inventoryDirectory = path.join(process.cwd(), "inventory");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function readJson(file: string) {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { throw new Error(`No se pudo leer ${path.relative(process.cwd(), file)}: ${error instanceof Error ? error.message : error}`); }
}

export const inventorySettings = readJson(path.join(inventoryDirectory, "settings.json")) as Settings;

export const inventoryVehicles: Vehicle[] = readdirSync(inventoryDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const slug = entry.name;
    const car = carJsonSchema.parse(readJson(path.join(inventoryDirectory, slug, "car.json")));
    const date = car.publishedAt ?? "2026-08-20T12:00:00Z";
    return {
      id: slug, slug, ...car, createdAt: date, updatedAt: date, deletedAt: null,
      images: car.images.map((image, index) => ({ id: `${slug}-image-${index + 1}`, url: `${basePath}${image.path}`, alt: image.alt, sortOrder: index, isCover: index === 0 })),
      features: car.features.map((feature, index) => ({ id: `${slug}-feature-${index + 1}`, ...feature }))
    };
  });
