"use client";

import { useCallback, useEffect, useState } from "react";
import type { SettingsJson } from "@/lib/car-json";
import { GithubError } from "@/lib/github-admin/client";
import { getSettings } from "@/lib/github-admin/settings";
import { listVehicles } from "@/lib/github-admin/vehicles";
import type { CarFile } from "@/lib/github-admin/types";

type RemoteState<T> = { status: "loading" | "ready" | "error"; data: T; error?: string };

function errorMessage(cause: unknown) {
  return cause instanceof GithubError || cause instanceof Error ? cause.message : "Error inesperado.";
}

export function useRemoteVehicles(token: string) {
  const [state, setState] = useState<RemoteState<CarFile[]>>({ status: "loading", data: [] });
  useEffect(() => {
    let cancelled = false;
    listVehicles(token).then(
      (vehicles) => { if (!cancelled) setState({ status: "ready", data: vehicles }); },
      (cause) => { if (!cancelled) setState({ status: "error", data: [], error: errorMessage(cause) }); }
    );
    return () => { cancelled = true; };
  }, [token]);
  const refresh = useCallback(async () => {
    try { setState({ status: "ready", data: await listVehicles(token) }); }
    catch (cause) { setState({ status: "error", data: [], error: errorMessage(cause) }); }
  }, [token]);
  return { ...state, refresh };
}

export function useRemoteSettings(token: string) {
  const [state, setState] = useState<RemoteState<SettingsJson | null>>({ status: "loading", data: null });
  useEffect(() => {
    let cancelled = false;
    getSettings(token).then(
      ({ data }) => { if (!cancelled) setState({ status: "ready", data }); },
      (cause) => { if (!cancelled) setState({ status: "error", data: null, error: errorMessage(cause) }); }
    );
    return () => { cancelled = true; };
  }, [token]);
  const refresh = useCallback(async () => {
    try { setState({ status: "ready", data: (await getSettings(token)).data }); }
    catch (cause) { setState({ status: "error", data: null, error: errorMessage(cause) }); }
  }, [token]);
  return { ...state, refresh };
}
