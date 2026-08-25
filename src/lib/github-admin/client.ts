import { BRANCH, OWNER, REPO } from "./types";

const API = "https://api.github.com";

export class GithubError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

function describeStatus(status: number, body: string) {
  if (status === 401) return "El token no es válido o fue revocado. Desconecta y conecta uno nuevo.";
  if (status === 403) return /rate limit/i.test(body) ? "GitHub alcanzó el límite de solicitudes. Espera unos minutos e inténtalo nuevamente." : "El token no tiene permisos sobre este repositorio. Revisa que tenga Contents: Read and write.";
  if (status === 404) return "No encontramos el recurso en el repositorio. Puede haber sido eliminado o renombrado.";
  if ((status === 409 || status === 422) && /does not match|sha/i.test(body)) return "No pudimos guardar porque el archivo cambió en GitHub. Recarga el vehículo e inténtalo nuevamente.";
  if (status === 422) return "GitHub rechazó la operación. Verifica los datos e inténtalo nuevamente.";
  return `GitHub respondió con el error ${status}. Inténtalo nuevamente.`;
}

export async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...init,
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...(init?.headers ?? {}) }
    });
  } catch {
    throw new GithubError("No pudimos conectar con GitHub. Revisa tu conexión e inténtalo nuevamente.");
  }
  const text = await response.text();
  if (!response.ok) throw new GithubError(describeStatus(response.status, text), response.status);
  return text ? JSON.parse(text) as T : {} as T;
}

export function repoPath(path: string) {
  return `/repos/${OWNER}/${REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export type FileContent = { sha: string; content: string };

export async function getFile(path: string, token: string): Promise<FileContent> {
  const file = await request<{ sha: string; content?: string; encoding?: string }>(`${repoPath(path)}?ref=${BRANCH}`, token);
  return { sha: file.sha, content: decodeBase64(file.content ?? "") };
}

export async function updateFile(path: string, content: string | Uint8Array, sha: string | undefined, message: string, token: string): Promise<string> {
  const body = { message, content: encodeContent(content), branch: BRANCH, ...(sha ? { sha } : {}) };
  const result = await request<{ content?: { sha?: string } }>(repoPath(path), token, { method: "PUT", body: JSON.stringify(body) });
  return result.content?.sha ?? "";
}

export async function deleteFile(path: string, sha: string, message: string, token: string) {
  await request(repoPath(path), token, { method: "DELETE", body: JSON.stringify({ message, sha, branch: BRANCH }) });
}

export function encodeContent(content: string | Uint8Array) {
  return bytesToBase64(typeof content === "string" ? new TextEncoder().encode(content) : content);
}

export function decodeBase64(value: string) {
  const bytes = Uint8Array.from(atob(value.replace(/\s/g, "")), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}
