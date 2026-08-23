export type VehicleStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "DRAFT";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC" | "OTHER";
export type BodyType = "SUV" | "SEDAN" | "HATCHBACK" | "PICKUP" | "WAGON" | "COUPE" | "VAN" | "OTHER";

export type VehicleImage = { id: string; url: string; alt: string; sortOrder: number; isCover: boolean };
export type VehicleFeature = { id: string; category: string; label: string; value?: string | null };

export type Vehicle = {
  id: string;
  slug: string;
  make: string;
  model: string;
  trim?: string | null;
  year: number;
  price: number;
  previousPrice?: number | null;
  mileageKm: number;
  transmission: Transmission;
  fuelType: FuelType;
  drivetrain?: string | null;
  engine?: string | null;
  bodyType: BodyType;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  doors?: number | null;
  seats?: number | null;
  horsepower?: number | null;
  location: string;
  status: VehicleStatus;
  featured: boolean;
  newArrival: boolean;
  opportunity: boolean;
  description?: string | null;
  highlights: string[];
  internalNotes?: string | null;
  publishedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  images: VehicleImage[];
  features: VehicleFeature[];
};

export type Settings = {
  brandName: string;
  whatsappNumber: string;
  phone?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  locationText?: string | null;
  siteTitle: string;
  siteDescription: string;
  showSold: boolean;
};
