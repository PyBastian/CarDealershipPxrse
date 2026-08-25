"use client";

import { useCallback, useState } from "react";
import { serializeCarJson } from "@/lib/car-json";
import { updateFile } from "@/lib/github-admin/client";
import type { CarFile } from "@/lib/github-admin/types";
import { duplicateVehicle, deleteVehicle, getVehicle, listVehicles, setVehicleStatus, toggleVehicleFeatured, vehicleName } from "@/lib/github-admin/vehicles";
import { ConfirmDialog, type ConfirmRequest } from "./confirm-dialog";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function useVehicleActions(token: string, refresh: () => Promise<void>) {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const run = useCallback(async (car: CarFile, action: () => Promise<unknown>) => {
    if (busySlug) return;
    setBusySlug(car.slug);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos completar la acción.");
    } finally {
      setBusySlug(null);
    }
  }, [busySlug, refresh]);

  const actions = {
    onStatus: (car: CarFile, status: CarFile["data"]["status"]) => run(car, () => setVehicleStatus(car, status, token)),
    onToggleFeatured: (car: CarFile) => run(car, () => toggleVehicleFeatured(car, token)),
    onDuplicate: (car: CarFile) => run(car, async () => {
      const vehicles = await listVehicles(token);
      await duplicateVehicle(car, vehicles.map((vehicle) => vehicle.slug), token);
    }),
    onDelete: (car: CarFile) => setConfirm({
      title: `¿Eliminar ${vehicleName(car.data)}?`,
      message: "Esta acción eliminará el vehículo del catálogo y creará un commit en GitHub.",
      onConfirm: () => { void run(car, () => deleteVehicle(car, token)); }
    }),
    onPriceChange: (car: CarFile, price: number) => run(car, async () => {
      const fresh = await getVehicle(car.slug, token);
      await updateFile(`inventory/${car.slug}/car.json`, serializeCarJson({ ...fresh.data, price }, basePath), fresh.sha, `admin: update price of ${vehicleName(fresh.data)}`, token);
    })
  };

  const dialog = <ConfirmDialog request={confirm} onClose={() => setConfirm(null)}/>;
  return { actions, busySlug, error, dialog };
}
