import { deleteFile, getFile, updateFile } from "./client";
import { listTree } from "./repository";
import { BRANCH, OWNER, REPO } from "./types";

const MAX_WIDTH = 1800;
const QUALITY = 0.82;

export function repoPhotoUrl(path: string) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/public${path}`;
}

export async function listRepoPhotos(token: string) {
  const tree = await listTree(token);
  return tree
    .map((entry) => entry.path)
    .filter((path) => /^public\/vehicles\/.+\.(png|jpe?g|webp|avif)$/i.test(path))
    .map((path) => path.replace(/^public/, ""))
    .sort();
}

export async function processImage(file: File): Promise<{ bytes: Uint8Array; extension: "webp" | "jpg" }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite procesar imágenes.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  let extension: "webp" | "jpg" = "webp";
  if (!blob) { blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85)); extension = "jpg"; }
  if (!blob) throw new Error("No pudimos procesar la imagen. Prueba con un archivo JPG o PNG.");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), extension };
}

export function nextImageNumber(images: { path: string }[], slug: string) {
  const numbers = images
    .filter((image) => image.path.startsWith(`/vehicles/${slug}/`))
    .map((image) => Number(image.path.split("/").pop()?.split(".")[0]))
    .filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

export async function uploadVehicleImage(slug: string, file: File, fileNumber: number, vehicleName: string, token: string) {
  const { bytes, extension } = await processImage(file);
  if (bytes.byteLength > 4 * 1024 * 1024) throw new Error("La imagen quedó demasiado grande después de comprimirla. Prueba con una versión más liviana.");
  const fileName = `${String(fileNumber).padStart(2, "0")}.${extension}`;
  await updateFile(`public/vehicles/${slug}/${fileName}`, bytes, undefined, `admin: add photo to ${vehicleName}`, token);
  return `/vehicles/${slug}/${fileName}`;
}

export async function deleteVehicleImage(imagePath: string, slug: string, token: string) {
  if (!imagePath.startsWith(`/vehicles/${slug}/`)) return;
  const file = await getFile(`public${imagePath}`, token);
  await deleteFile(`public${imagePath}`, file.sha, `admin: remove photo from ${slug}`, token);
}
