import { z } from "zod";

const optionalInt = z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().positive().optional());
export const vehicleSchema = z.object({
  make: z.string().trim().min(2).max(60), model: z.string().trim().min(1).max(60), trim: z.string().trim().max(80).optional(),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1), price: z.coerce.number().int().positive(), previousPrice: optionalInt,
  mileageKm: z.coerce.number().int().min(0), transmission: z.enum(["MANUAL", "AUTOMATIC"]), fuelType: z.enum(["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC", "OTHER"]),
  drivetrain: z.string().trim().max(30).optional(), engine: z.string().trim().max(30).optional(), bodyType: z.enum(["SUV", "SEDAN", "HATCHBACK", "PICKUP", "WAGON", "COUPE", "VAN", "OTHER"]),
  exteriorColor: z.string().trim().max(40).optional(), interiorColor: z.string().trim().max(40).optional(), doors: optionalInt, seats: optionalInt, horsepower: optionalInt,
  location: z.string().trim().min(3).max(120), status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "DRAFT"]), description: z.string().trim().max(5000).optional(), internalNotes: z.string().trim().max(3000).optional()
});
