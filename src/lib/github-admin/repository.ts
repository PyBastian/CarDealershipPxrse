import { request } from "./client";
import { BRANCH, OWNER, REPO } from "./types";

export async function validateToken(token: string) {
  const repo = await request<{ permissions?: Record<string, boolean> }>(`/repos/${OWNER}/${REPO}`, token);
  if (repo.permissions && (repo.permissions.push === false || repo.permissions.pull === false)) throw new Error("El token no tiene acceso de escritura al repositorio.");
  return true;
}

export async function listTree(token: string) {
  const tree = await request<{ tree: { path: string; type: string; sha?: string }[] }>(`/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`, token);
  return tree.tree.filter((entry) => entry.type === "blob");
}
