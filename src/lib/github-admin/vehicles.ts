import { carJsonSchema, serializeCarJson, type CarJson } from "@/lib/car-json";
import { slugify } from "@/lib/format";
import { getFile, updateFile, deleteFile } from "./client";
import { listTree } from "./repository";
import type { CarFile } from "./types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function vehicleName(data: CarJson) {
  return [data.make, data.model, data.trim ?? "", String(data.year)].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function carPath(slug: string) {
  return `inventory/${slug}/car.json`;
}

export async function getVehicle(slug: string, token: string): Promise<CarFile> {
  const file = await getFile(carPath(slug), token);
  return { slug, sha: file.sha, data: carJsonSchema.parse(JSON.parse(file.content)) };
}

export async function listVehicles(token: string): Promise<CarFile[]> {
  const tree = await listTree(token);
  const entries = tree.filter((entry) => /^inventory\/[^/]+\/car\.json$/.test(entry.path));
  const vehicles = await Promise.all(entries.map(async (entry) => {
    const slug = entry.path.split("/")[1];
    const raw = await fetchRaw(entry.path, token);
    return { slug, sha: entry.sha ?? "", data: carJsonSchema.parse(JSON.parse(raw)) };
  }));
  return vehicles.sort((a, b) => (b.data.featured ? 1 : 0) - (a.data.featured ? 1 : 0) || (b.data.publishedAt ?? "").localeCompare(a.data.publishedAt ?? ""));
}

async function fetchRaw(path: string, token: string) {
  const file = await getFile(path, token);
  return file.content;
}

async function persist(slug: string, data: CarJson, sha: string | undefined, message: string, token: string) {
  await updateFile(carPath(slug), serializeCarJson(data, basePath), sha, message, token);
}

export async function saveVehicle(vehicle: CarFile, token: string) {
  await persist(vehicle.slug, vehicle.data, vehicle.sha, `admin: update ${vehicleName(vehicle.data)}`, token);
}

export async function createVehicle(data: CarJson, takenSlugs: string[], token: string) {
  const base = slugify(vehicleName(data));
  let slug = base;
  let suffix = 2;
  while (takenSlugs.includes(slug)) slug = `${base}-${suffix++}`;
  await persist(slug, data, undefined, `admin: add ${vehicleName(data)}`, token);
  return slug;
}

export async function deleteVehicle(vehicle: CarFile, token: string) {
  await deleteFile(carPath(vehicle.slug), vehicle.sha, `admin: delete ${vehicleName(vehicle.data)}`, token);
}

const statusMessages = {
  AVAILABLE: (name: string) => `admin: mark ${name} as available`,
  RESERVED: (name: string) => `admin: mark ${name} as reserved`,
  SOLD: (name: string) => `admin: mark ${name} as sold`,
  DRAFT: (name: string) => `admin: unpublish ${name}`
} as const;

export async function setVehicleStatus(vehicle: CarFile, status: CarJson["status"], token: string) {
  const next = { ...vehicle, data: { ...vehicle.data, status, publishedAt: status === "DRAFT" ? null : vehicle.data.publishedAt ?? new Date().toISOString() } };
  await persist(next.slug, next.data, next.sha, statusMessages[status](vehicleName(vehicle.data)), token);
}

export async function toggleVehicleFeatured(vehicle: CarFile, token: string) {
  const featured = !vehicle.data.featured;
  await persist(vehicle.slug, { ...vehicle.data, featured }, vehicle.sha, `admin: ${featured ? "feature" : "unfeature"} ${vehicleName(vehicle.data)}`, token);
}

export async function duplicateVehicle(vehicle: CarFile, takenSlugs: string[], token: string) {
  const base = slugify(`${vehicleName(vehicle.data)} copia`);
  let slug = base;
  let suffix = 2;
  while (takenSlugs.includes(slug)) slug = `${base}-${suffix++}`;
  const data: CarJson = { ...vehicle.data, status: "DRAFT", featured: false, newArrival: false, publishedAt: null };
  await persist(slug, data, undefined, `admin: duplicate ${vehicleName(vehicle.data)}`, token);
  return slug;
}
