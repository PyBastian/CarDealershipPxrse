import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { inventorySettings, inventoryVehicles } from "../src/lib/inventory";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://nova:nova@localhost:5432/nova_autos" }) });

await prisma.vehicleFeature.deleteMany();
await prisma.vehicleImage.deleteMany();
await prisma.vehicle.deleteMany();

for (const vehicle of inventoryVehicles) {
  await prisma.vehicle.create({
    data: {
      slug: vehicle.slug,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      year: vehicle.year,
      price: vehicle.price,
      previousPrice: vehicle.previousPrice,
      mileageKm: vehicle.mileageKm,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      drivetrain: vehicle.drivetrain,
      engine: vehicle.engine,
      bodyType: vehicle.bodyType,
      exteriorColor: vehicle.exteriorColor,
      interiorColor: vehicle.interiorColor,
      doors: vehicle.doors,
      seats: vehicle.seats,
      horsepower: vehicle.horsepower,
      location: vehicle.location,
      status: vehicle.status,
      featured: vehicle.featured,
      newArrival: vehicle.newArrival,
      opportunity: vehicle.opportunity,
      description: vehicle.description,
      highlights: vehicle.highlights,
      publishedAt: vehicle.publishedAt ? new Date(vehicle.publishedAt) : null,
      images: { create: vehicle.images.map(({ url, alt, sortOrder, isCover }) => ({ url, alt, sortOrder, isCover })) },
      features: { create: vehicle.features.map(({ category, label, value }) => ({ category, label, value })) }
    }
  });
}

await prisma.globalSettings.upsert({
  where: { id: 1 },
  update: inventorySettings,
  create: { id: 1, ...inventorySettings }
});

await prisma.$disconnect();
console.log(`Seed listo: ${inventoryVehicles.length} vehículos de demostración.`);
