import { z } from "zod";

export const carImageSchema = z.object({ path: z.string().startsWith("/"), alt: z.string().min(1) });
export const carFeatureSchema = z.object({ category: z.string().min(1), label: z.string().min(1), value: z.string().optional() });

export const carJsonSchema = z.object({
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
  publishedAt: z.string().datetime().nullable().optional(), images: z.array(carImageSchema).default([]), features: z.array(carFeatureSchema).default([])
});

export type CarJson = z.infer<typeof carJsonSchema>;

export const settingsSchema = z.object({
  brandName: z.string().min(1),
  whatsappNumber: z.string().regex(/^\d{8,15}$/),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().or(z.literal("")).optional(),
  instagramUrl: z.string().nullable().optional(),
  locationText: z.string().nullable().optional(),
  siteTitle: z.string().min(1),
  siteDescription: z.string().min(1),
  showSold: z.boolean()
});

export type SettingsJson = z.infer<typeof settingsSchema>;

const omitNullable = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined)) as T;

export function serializeCarJson(data: CarJson, basePath = "") {
  const clean = omitNullable({
    ...data,
    trim: data.trim ?? null,
    previousPrice: data.previousPrice ?? undefined,
    drivetrain: data.drivetrain ?? null,
    engine: data.engine ?? null,
    exteriorColor: data.exteriorColor ?? null,
    interiorColor: data.interiorColor ?? null,
    doors: data.doors ?? null,
    seats: data.seats ?? null,
    horsepower: data.horsepower ?? null,
    description: data.description ?? null,
    publishedAt: data.status === "DRAFT" ? null : data.publishedAt ?? new Date().toISOString(),
    images: data.images.map((image) => ({ ...image, path: stripBasePath(image.path, basePath) }))
  });
  return `${JSON.stringify(clean, null, 2)}\n`;
}

export function stripBasePath(path: string, basePath: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) : path;
}
