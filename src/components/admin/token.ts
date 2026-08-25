"use client";

import { useSyncExternalStore } from "react";
import { clearStoredToken, readStoredToken, storeToken } from "@/lib/github-admin/storage";

let cache: string | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function getSnapshot() {
  if (!initialized && typeof window !== "undefined") { cache = readStoredToken(); initialized = true; }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() { listeners.forEach((listener) => listener()); }

export function connectToken(token: string) {
  storeToken(token);
  cache = token;
  initialized = true;
  emit();
}

export function disconnectToken() {
  clearStoredToken();
  cache = null;
  emit();
}

export function useGithubToken() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
