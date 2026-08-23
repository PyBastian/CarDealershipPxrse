import type { BodyType, FuelType, Transmission, Vehicle } from "./types";

export type CatalogState = {
  q?: string;
  marca?: string;
  modelo?: string;
  carroceria?: BodyType;
  transmision?: Transmission;
  combustible?: FuelType;
  precioMin?: number;
  precioMax?: number;
  anioMin?: number;
  anioMax?: number;
  kmMax?: number;
  orden: string;
};

const body = new Set(["SUV", "SEDAN", "HATCHBACK", "PICKUP", "WAGON", "COUPE", "VAN", "OTHER"]);
const transmissions = new Set(["MANUAL", "AUTOMATIC"]);
const fuels = new Set(["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC", "OTHER"]);
const sorts = new Set(["recommended", "recent", "price-asc", "price-desc", "km-asc", "km-desc", "year-desc", "year-asc"]);
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const positive = (value: string | undefined) => value && /^\d+$/.test(value) ? Number(value) : undefined;

export function parseCatalogState(params: Record<string, string | string[] | undefined>): CatalogState {
  const rawBody = first(params.carroceria);
  const rawTransmission = first(params.transmision);
  const rawFuel = first(params.combustible);
  const rawSort = first(params.orden);
  return {
    q: first(params.q)?.trim() || undefined,
    marca: first(params.marca)?.trim() || undefined,
    modelo: first(params.modelo)?.trim() || undefined,
    carroceria: rawBody && body.has(rawBody) ? rawBody as BodyType : undefined,
    transmision: rawTransmission && transmissions.has(rawTransmission) ? rawTransmission as Transmission : undefined,
    combustible: rawFuel && fuels.has(rawFuel) ? rawFuel as FuelType : undefined,
    precioMin: positive(first(params.precioMin)),
    precioMax: positive(first(params.precioMax)),
    anioMin: positive(first(params.anioMin)),
    anioMax: positive(first(params.anioMax)),
    kmMax: positive(first(params.kmMax)),
    orden: rawSort && sorts.has(rawSort) ? rawSort : "recommended"
  };
}

export function filterVehicles(vehicles: Vehicle[], state: CatalogState) {
  const terms = state.q?.toLocaleLowerCase("es-CL").split(/\s+/).filter(Boolean) ?? [];
  return vehicles.filter((vehicle) => {
    const searchable = `${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ""} ${vehicle.year}`.toLocaleLowerCase("es-CL");
    return vehicle.status !== "DRAFT" && !vehicle.deletedAt &&
      terms.every((term) => searchable.includes(term)) && (!state.marca || vehicle.make === state.marca) &&
      (!state.modelo || vehicle.model === state.modelo) && (!state.carroceria || vehicle.bodyType === state.carroceria) &&
      (!state.transmision || vehicle.transmission === state.transmision) && (!state.combustible || vehicle.fuelType === state.combustible) &&
      (!state.precioMin || vehicle.price >= state.precioMin) && (!state.precioMax || vehicle.price <= state.precioMax) &&
      (!state.anioMin || vehicle.year >= state.anioMin) && (!state.anioMax || vehicle.year <= state.anioMax) &&
      (!state.kmMax || vehicle.mileageKm <= state.kmMax);
  }).sort(sorters[state.orden] ?? sorters.recommended);
}

const time = (value: Date | string | null | undefined) => value ? new Date(value).getTime() : 0;
const sorters: Record<string, (a: Vehicle, b: Vehicle) => number> = {
  recommended: (a, b) => Number(b.featured) - Number(a.featured) || time(b.publishedAt) - time(a.publishedAt),
  recent: (a, b) => time(b.publishedAt) - time(a.publishedAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "km-asc": (a, b) => a.mileageKm - b.mileageKm,
  "km-desc": (a, b) => b.mileageKm - a.mileageKm,
  "year-desc": (a, b) => b.year - a.year,
  "year-asc": (a, b) => a.year - b.year
};

export function relatedVehicles(current: Vehicle, vehicles: Vehicle[]) {
  return vehicles.filter((v) => v.id !== current.id && v.status === "AVAILABLE").sort((a, b) =>
    Number(b.bodyType === current.bodyType) - Number(a.bodyType === current.bodyType) ||
    Math.abs(a.price - current.price) - Math.abs(b.price - current.price) ||
    Number(b.make === current.make) - Number(a.make === current.make)
  ).slice(0, 4);
}

export function activeFilterCount(state: CatalogState) {
  return Object.entries(state).filter(([key, value]) => key !== "orden" && value !== undefined).length;
}

export const isPublicStatus = (status: Vehicle["status"], showSold = false) => status === "AVAILABLE" || status === "RESERVED" || (showSold && status === "SOLD");
