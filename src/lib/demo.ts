import type { Settings, Vehicle } from "./types";

const now = new Date("2026-08-20T12:00:00Z");
const photos = ["/vehicles/suv-graphite.png", "/vehicles/hatchback-blue.png", "/vehicles/pickup-white.png"];
const specs = [
  { id: "f1", category: "Seguridad", label: "Cámara de retroceso" },
  { id: "f2", category: "Confort", label: "Control crucero" },
  { id: "f3", category: "Entretenimiento", label: "Apple CarPlay" }
];

function car(index: number, input: Partial<Vehicle> & Pick<Vehicle, "make" | "model" | "year" | "price" | "mileageKm" | "transmission" | "fuelType" | "bodyType">): Vehicle {
  const trim = input.trim ?? null;
  const slug = `${input.make}-${input.model}-${trim ?? ""}-${input.year}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const image = photos[index % photos.length];
  const gallery = index === 0 ? [image, "/vehicles/suv-graphite-side.png", "/vehicles/suv-graphite-rear.png"] : [image, image, image];
  return {
    id: `demo-${index + 1}`,
    slug,
    trim,
    previousPrice: null,
    drivetrain: null,
    engine: null,
    exteriorColor: null,
    interiorColor: null,
    doors: 5,
    seats: 5,
    horsepower: null,
    location: "Santiago, Región Metropolitana",
    status: "AVAILABLE",
    featured: index < 4,
    newArrival: index < 2,
    opportunity: false,
    description: "Vehículo de demostración presentado con información clara y verificable. Coordina una visita para conocer su estado y antecedentes en detalle.",
    highlights: ["Mantenciones al día", "Documentación disponible", "Visita coordinada"],
    publishedAt: new Date(now.getTime() - index * 86400000),
    createdAt: new Date(now.getTime() - index * 86400000),
    updatedAt: now,
    images: gallery.map((url, n) => ({ id: `img-${index}-${n}`, url, alt: `${input.make} ${input.model}, vista ${n + 1}`, sortOrder: n, isCover: n === 0 })),
    features: specs.map((feature) => ({ ...feature, id: `${feature.id}-${index}` })),
    ...input
  };
}

export const demoVehicles: Vehicle[] = [
  car(0, { make: "Toyota", model: "RAV4", trim: "Limited AWD", year: 2022, price: 19990000, previousPrice: 20990000, mileageKm: 42500, transmission: "AUTOMATIC", fuelType: "GASOLINE", bodyType: "SUV", drivetrain: "AWD", engine: "2.0 L", exteriorColor: "Grafito", featured: true }),
  car(1, { make: "Mazda", model: "CX-5", trim: "GT 2.5", year: 2021, price: 18490000, mileageKm: 51800, transmission: "AUTOMATIC", fuelType: "GASOLINE", bodyType: "SUV", newArrival: true }),
  car(2, { make: "Ford", model: "Ranger", trim: "XLT 4x4", year: 2020, price: 22990000, mileageKm: 78900, transmission: "AUTOMATIC", fuelType: "DIESEL", bodyType: "PICKUP", drivetrain: "4x4", seats: 5 }),
  car(3, { make: "Suzuki", model: "Swift", trim: "GLX", year: 2023, price: 11990000, mileageKm: 18900, transmission: "MANUAL", fuelType: "GASOLINE", bodyType: "HATCHBACK", opportunity: true }),
  car(4, { make: "Hyundai", model: "Tucson", trim: "NX4", year: 2022, price: 20490000, mileageKm: 35600, transmission: "AUTOMATIC", fuelType: "GASOLINE", bodyType: "SUV", status: "RESERVED" }),
  car(5, { make: "Kia", model: "Sportage", trim: "EX", year: 2021, price: 17990000, mileageKm: 47200, transmission: "AUTOMATIC", fuelType: "GASOLINE", bodyType: "SUV" }),
  car(6, { make: "BMW", model: "320i", trim: "Sport Line", year: 2019, price: 21990000, mileageKm: 63900, transmission: "AUTOMATIC", fuelType: "GASOLINE", bodyType: "SEDAN" }),
  car(7, { make: "Peugeot", model: "3008", trim: "Allure BlueHDi", year: 2020, price: 16490000, mileageKm: 70300, transmission: "AUTOMATIC", fuelType: "DIESEL", bodyType: "SUV", status: "SOLD" })
];

export const demoSettings: Settings = {
  brandName: "NOVA AUTOS",
  whatsappNumber: "56944125897",
  phone: "+56 9 4412 5897",
  email: "hola@novaautos.cl",
  instagramUrl: "https://instagram.com",
  locationText: "Santiago, Región Metropolitana",
  siteTitle: "NOVA AUTOS | Selección de autos usados",
  siteDescription: "Autos usados seleccionados, con información clara y contacto directo.",
  showSold: false
};
