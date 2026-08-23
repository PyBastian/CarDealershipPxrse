"use server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
const schema = z.object({ brandName: z.string().trim().min(2), whatsappNumber: z.string().regex(/^\d{8,15}$/), phone: z.string().trim().optional(), email: z.union([z.literal(""), z.email()]).optional(), instagramUrl: z.union([z.literal(""), z.url()]).optional(), locationText: z.string().trim().optional(), siteTitle: z.string().trim().min(5), siteDescription: z.string().trim().min(20).max(180) });
export async function saveSettings(formData: FormData) { if (!await getServerSession(authOptions)) throw new Error("No autorizado"); const value = schema.parse(Object.fromEntries(formData)); await getPrisma().globalSettings.upsert({ where: { id: 1 }, create: { id: 1, ...value, showSold: formData.get("showSold") === "on" }, update: { ...value, showSold: formData.get("showSold") === "on" } }); revalidatePath("/", "layout"); redirect("/admin/configuracion?guardado=1"); }
