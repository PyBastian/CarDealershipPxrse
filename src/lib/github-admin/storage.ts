const KEY = "palomin-github-token:v1";

export function readStoredToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function storeToken(token: string) {
  try { localStorage.setItem(KEY, token); } catch {}
}

export function clearStoredToken() {
  try { localStorage.removeItem(KEY); } catch {}
}
