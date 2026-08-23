"use server";

import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/vehicle-validation";

async function requireAdmin() { if (!await getServerSession(authOptions)) throw new Error("No autorizado"); }

async function uniqueSlug(base: string, id?: string) {
  const prisma = getPrisma(); let slug = base; let suffix = 2;
  while (await prisma.vehicle.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } })) slug = `${base}-${suffix++}`;
  return slug;
}

async function uploadedImages(files: File[], name: string) {
  const outputDir = path.join(process.cwd(), "public", "uploads", "vehicles");
  await mkdir(outputDir, { recursive: true });
  const images = [];
  for (const file of files.filter((item) => item.size > 0)) {
    if (file.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("La foto debe ser JPG, PNG, WebP o AVIF y pesar máximo 10 MB.");
    const source = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 600 || metadata.height < 400) throw new Error("La foto debe medir al menos 600 × 400 px.");
    const filename = `${randomUUID()}.webp`;
    await sharp(source).rotate().resize({ width: 1800, height: 1350, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(outputDir, filename));
    images.push({ url: `/uploads/vehicles/${filename}`, alt: name, width: metadata.width, height: metadata.height });
  }
  return images;
}

export async function saveVehicle(id: string | undefined, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData);
  const value = vehicleSchema.parse(raw);
  const prisma = getPrisma();
  const slug = await uniqueSlug(slugify(`${value.make}-${value.model}-${value.trim ?? ""}-${value.year}`), id);
  const highlights = String(formData.get("highlights") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
  const featureRows = String(formData.get("features") ?? "").split("\n").map((row) => row.split("|").map((item) => item.trim())).filter((row) => row[0] && row[1]);
  const existing = String(formData.get("imageUrls") ?? "").split("\n").map((url) => url.trim()).filter((url) => url.startsWith("/"));
  const uploads = await uploadedImages(formData.getAll("photos").filter((file): file is File => file instanceof File), `${value.make} ${value.model}`);
  const data = { ...value, trim: value.trim || null, previousPrice: value.previousPrice ?? null, drivetrain: value.drivetrain || null, engine: value.engine || null, exteriorColor: value.exteriorColor || null, interiorColor: value.interiorColor || null, description: value.description || null, internalNotes: value.internalNotes || null, slug, highlights, featured: formData.get("featured") === "on", newArrival: formData.get("newArrival") === "on", opportunity: formData.get("opportunity") === "on", publishedAt: value.status === "DRAFT" ? null : new Date() };
  const images = [...existing.map((url) => ({ url, alt: `${value.make} ${value.model}`, width: null, height: null })), ...uploads];
  if (id) await prisma.vehicle.update({ where: { id }, data: { ...data, images: { deleteMany: {}, create: images.map((image, index) => ({ ...image, sortOrder: index, isCover: index === 0 })) }, features: { deleteMany: {}, create: featureRows.map(([category, label, featureValue]) => ({ category, label, value: featureValue || null })) } } });
  else await prisma.vehicle.create({ data: { ...data, images: { create: images.map((image, index) => ({ ...image, sortOrder: index, isCover: index === 0 })) }, features: { create: featureRows.map(([category, label, featureValue]) => ({ category, label, value: featureValue || null })) } } });
  revalidatePath("/", "layout"); redirect("/admin/autos");
}

export async function setVehicleStatus(id: string, status: "AVAILABLE" | "RESERVED" | "SOLD" | "DRAFT") { await requireAdmin(); await getPrisma().vehicle.update({ where: { id }, data: { status, publishedAt: status === "DRAFT" ? null : new Date() } }); revalidatePath("/", "layout"); redirect(`/admin/autos/${id}`); }
export async function softDeleteVehicle(id: string) { await requireAdmin(); await getPrisma().vehicle.update({ where: { id }, data: { deletedAt: new Date() } }); revalidatePath("/", "layout"); redirect("/admin/autos"); }
export async function duplicateVehicle(id: string) {
  await requireAdmin();
  const prisma = getPrisma();
  const source = await prisma.vehicle.findUniqueOrThrow({ where: { id }, include: { images: true, features: true } });
  const slug = await uniqueSlug(`${source.slug}-copia`);
  await prisma.vehicle.create({ data: {
    slug, stockCode: null, make: source.make, model: source.model, trim: source.trim, year: source.year, price: source.price, previousPrice: source.previousPrice,
    mileageKm: source.mileageKm, transmission: source.transmission, fuelType: source.fuelType, drivetrain: source.drivetrain, engine: source.engine,
    bodyType: source.bodyType, exteriorColor: source.exteriorColor, interiorColor: source.interiorColor, doors: source.doors, seats: source.seats,
    horsepower: source.horsepower, location: source.location, status: "DRAFT", featured: false, newArrival: false, opportunity: source.opportunity,
    description: source.description, highlights: source.highlights, internalNotes: source.internalNotes, publishedAt: null,
    images: { create: source.images.map((image) => ({ url: image.url, alt: image.alt, sortOrder: image.sortOrder, isCover: image.isCover, width: image.width, height: image.height })) },
    features: { create: source.features.map((feature) => ({ category: feature.category, label: feature.label, value: feature.value })) }
  } });
  revalidatePath("/admin/autos");
  redirect("/admin/autos");
}
