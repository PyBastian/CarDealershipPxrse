"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Loader2, Save, Trash2 } from "lucide-react";
import { serializeCarJson, type CarJson } from "@/lib/car-json";
import { publicSiteUrl } from "@/lib/base-path";
import { labels } from "@/lib/format";
import { GithubError, updateFile } from "@/lib/github-admin/client";
import { vehicleSchema } from "@/lib/vehicle-validation";
import type { CarFile } from "@/lib/github-admin/types";
import { createVehicle, deleteVehicle, duplicateVehicle, getVehicle, listVehicles, saveVehicle, setVehicleStatus, toggleVehicleFeatured, vehicleName } from "@/lib/github-admin/vehicles";
import { ConfirmDialog, type ConfirmRequest } from "./confirm-dialog";
import { ImageManager } from "./image-manager";
import { SaveBanner, type SaveState } from "./save-state";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function VehicleEditor({ slug, token }: { slug?: string; token: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [car, setCar] = useState<CarFile | null>(null);
  const [state, setState] = useState<SaveState>({ kind: slug ? "saving" : "idle", message: slug ? "Cargando vehículo…" : undefined });
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const name = car ? vehicleName(car.data) : "";

  useEffect(() => {
    if (!slug) return;
    getVehicle(slug, token)
      .then((file) => { setCar(file); setState({ kind: "idle" }); })
      .catch((cause) => setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos cargar el vehículo." }));
  }, [slug, token]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (!dirty) return; event.preventDefault(); event.returnValue = ""; }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function refreshCar(updatedSlug: string) {
    const fresh = await getVehicle(updatedSlug, token);
    setCar(fresh);
    setDirty(false);
    return fresh;
  }

  async function persistData(slug: string, next: CarJson, message: string) {
    const fresh = await getVehicle(slug, token);
    await updateFile(`inventory/${slug}/car.json`, serializeCarJson(next, basePath), fresh.sha, message, token);
    await refreshCar(slug);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!formRef.current || state.kind === "saving") return;
    const parsed = buildCarJson(formRef.current, car?.data);
    if (!parsed.ok) { setState({ kind: "error", message: parsed.error }); return; }
    setState({ kind: "saving", message: "Guardando…" });
    try {
      if (!car) {
        const vehicles = await listVehicles(token);
        const newSlug = await createVehicle(parsed.data, vehicles.map((vehicle) => vehicle.slug), token);
        await refreshCar(newSlug);
        history.replaceState(null, "", `${basePath}/TheLastPalomin/autos/${newSlug}/`);
        setState({ kind: "success" });
      } else {
        await saveVehicle({ ...car, data: parsed.data }, token);
        await refreshCar(car.slug);
        setState({ kind: "success" });
      }
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof GithubError || cause instanceof Error ? cause.message : "No pudimos guardar." });
    }
  }

  async function changeStatus(status: CarJson["status"]) {
    if (!car || state.kind === "saving") return;
    setState({ kind: "saving", message: "Guardando…" });
    try {
      await setVehicleStatus(car, status, token);
      await refreshCar(car.slug);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos cambiar el estado." });
    }
  }

  async function toggleFeatured() {
    if (!car || state.kind === "saving") return;
    setState({ kind: "saving", message: "Guardando…" });
    try {
      await toggleVehicleFeatured(car, token);
      await refreshCar(car.slug);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos actualizar." });
    }
  }

  async function handleImagesChange(images: CarJson["images"], message: string) {
    if (!car) return;
    try {
      setState({ kind: "saving", message: "Actualizando fotos…" });
      await persistData(car.slug, { ...car.data, images }, message);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos actualizar las fotos." });
    }
  }

  async function handleDuplicate() {
    if (!car) return;
    try {
      const vehicles = await listVehicles(token);
      await duplicateVehicle(car, vehicles.map((vehicle) => vehicle.slug), token);
      router.push("/TheLastPalomin/inventario/");
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos duplicar." });
    }
  }

  function requestDelete() {
    if (!car) return;
    setConfirm({
      title: `¿Eliminar ${name}?`,
      message: "Esta acción eliminará el vehículo del catálogo y creará un commit en GitHub.",
      onConfirm: async () => {
        try {
          await deleteVehicle(car, token);
          router.push("/TheLastPalomin/inventario/");
        } catch (cause) {
          setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos eliminar." });
        }
      }
    });
  }

  const data = car?.data;

  return <div className="palomin-page">
    <div className="palomin-heading">
      <div>
        <Link className="text-link" href="/TheLastPalomin/inventario/"><ArrowLeft size={16}/> Inventario</Link>
        <h1>{data ? `${data.year} ${data.make} ${data.model}` : "Nuevo vehículo"}</h1>
        <p>{data ? `inventory/${car!.slug}/car.json` : "La ruta inventory/…/car.json se genera al guardar"}</p>
      </div>
      <span className={`status ${data ? `palomin-status-${data.status.toLowerCase()}` : ""}`}>{data ? labels.status[data.status] : labels.status.DRAFT}</span>
    </div>

    <SaveBanner state={state}/>
    {state.kind === "success" && <p className="palomin-post-save">GitHub Actions está reconstruyendo el sitio público. <a href={publicSiteUrl("/")} target="_blank" rel="noreferrer">Ver sitio público</a></p>}

    {!slug && !data && <form ref={formRef} className="vehicle-form palomin-editor-form" onSubmit={handleSave} onInput={() => setDirty(true)}>
      <Sections/>
      <StickyActions saving={state.kind === "saving"} dirty={dirty} onCancel={() => router.push("/TheLastPalomin/inventario/")}/>
    </form>}

    {data && <form ref={formRef} className="vehicle-form palomin-editor-form" onSubmit={handleSave} onInput={() => setDirty(true)} key={`${car!.slug}-${car!.sha}`}>
      <Sections defaults={data}/>
      <section><h2>Fotos</h2><ImageManager slug={car!.slug} name={name} images={data.images} token={token} onChange={handleImagesChange}/></section>
      <StickyActions saving={state.kind === "saving"} dirty={dirty} onCancel={() => router.push("/TheLastPalomin/inventario/")}/>
    </form>}

    {data && <div className="danger-zone">
      <div><h2>Acciones rápidas</h2><p>Cambiar estado, duplicar o retirar este vehículo del catálogo.</p></div>
      <div>
        <button type="button" className="button button-secondary" disabled={state.kind === "saving"} onClick={() => changeStatus(data.status === "RESERVED" ? "AVAILABLE" : "RESERVED")}>{data.status === "RESERVED" ? "Marcar disponible" : "Marcar reservado"}</button>
        <button type="button" className="button button-secondary" disabled={state.kind === "saving"} onClick={() => changeStatus("SOLD")}>Marcar vendido</button>
        <button type="button" className="button button-secondary" disabled={state.kind === "saving"} onClick={toggleFeatured}>{data.featured ? "Quitar destacado" : "Destacar"}</button>
        <button type="button" className="button button-secondary" disabled={state.kind === "saving"} onClick={handleDuplicate}><Copy size={16}/> Duplicar</button>
        <button type="button" className="button danger" disabled={state.kind === "saving"} onClick={requestDelete}><Trash2 size={16}/> Eliminar</button>
      </div>
    </div>}

    <ConfirmDialog request={confirm} onClose={() => setConfirm(null)}/>
  </div>;
}

function Sections({ defaults }: { defaults?: CarJson }) {
  return <>
    <section><h2>Información principal</h2><div className="form-grid">
      <label>Marca<input required name="make" defaultValue={defaults?.make}/></label>
      <label>Modelo<input required name="model" defaultValue={defaults?.model}/></label>
      <label>Versión<input name="trim" defaultValue={defaults?.trim ?? ""}/></label>
      <label>Año<input required type="number" inputMode="numeric" name="year" min="1950" max={new Date().getFullYear() + 1} defaultValue={defaults?.year ?? new Date().getFullYear()}/></label>
      <label>Carrocería<select name="bodyType" defaultValue={defaults?.bodyType ?? "SUV"}><option>SUV</option><option value="SEDAN">Sedán</option><option value="HATCHBACK">Hatchback</option><option value="PICKUP">Pickup</option><option value="WAGON">Station Wagon</option><option value="COUPE">Coupé</option><option value="VAN">Van</option><option value="OTHER">Otro</option></select></label>
      <label>Ubicación<input required name="location" defaultValue={defaults?.location ?? "Santiago, Región Metropolitana"}/></label>
    </div></section>

    <section><h2>Precio</h2><div className="form-grid">
      <label>Precio (CLP)<input required type="number" inputMode="numeric" name="price" min="1" defaultValue={defaults?.price}/></label>
      <label>Precio anterior<input type="number" inputMode="numeric" name="previousPrice" min="1" defaultValue={defaults?.previousPrice ?? ""}/></label>
    </div></section>

    <section><h2>Uso</h2><div className="form-grid">
      <label>Kilometraje<input required type="number" inputMode="numeric" name="mileageKm" min="0" defaultValue={defaults?.mileageKm ?? 0}/></label>
      <label>Transmisión<select name="transmission" defaultValue={defaults?.transmission ?? "AUTOMATIC"}><option value="AUTOMATIC">Automática</option><option value="MANUAL">Manual</option></select></label>
      <label>Combustible<select name="fuelType" defaultValue={defaults?.fuelType ?? "GASOLINE"}><option value="GASOLINE">Bencina</option><option value="DIESEL">Diésel</option><option value="HYBRID">Híbrido</option><option value="ELECTRIC">Eléctrico</option><option value="OTHER">Otro</option></select></label>
      <label>Tracción<input name="drivetrain" defaultValue={defaults?.drivetrain ?? ""}/></label>
      <label>Motor<input name="engine" defaultValue={defaults?.engine ?? ""}/></label>
      <label>Potencia (hp)<input type="number" inputMode="numeric" name="horsepower" defaultValue={defaults?.horsepower ?? ""}/></label>
    </div></section>

    <section><h2>Exterior e interior</h2><div className="form-grid">
      <label>Color exterior<input name="exteriorColor" defaultValue={defaults?.exteriorColor ?? ""}/></label>
      <label>Color interior<input name="interiorColor" defaultValue={defaults?.interiorColor ?? ""}/></label>
      <label>Puertas<input type="number" inputMode="numeric" name="doors" min="1" defaultValue={defaults?.doors ?? ""}/></label>
      <label>Asientos<input type="number" inputMode="numeric" name="seats" min="1" defaultValue={defaults?.seats ?? ""}/></label>
    </div></section>

    <section><h2>Venta</h2><div className="form-grid">
      <label>Estado<select name="status" defaultValue={defaults?.status ?? "AVAILABLE"}>
        <option value="AVAILABLE">{labels.status.AVAILABLE}</option><option value="RESERVED">{labels.status.RESERVED}</option><option value="SOLD">{labels.status.SOLD}</option><option value="DRAFT">{labels.status.DRAFT}</option>
      </select></label>
    </div><div className="form-checks">
      <label className="inline-check"><input type="checkbox" name="featured" defaultChecked={defaults?.featured}/> Destacado</label>
      <label className="inline-check"><input type="checkbox" name="newArrival" defaultChecked={defaults?.newArrival}/> Nuevo ingreso</label>
      <label className="inline-check"><input type="checkbox" name="opportunity" defaultChecked={defaults?.opportunity}/> Oportunidad</label>
    </div></section>

    <section><h2>Descripción</h2>
      <label>Descripción<textarea name="description" defaultValue={defaults?.description ?? ""}/></label>
      <label>Destacados <small>Uno por línea</small><textarea name="highlights" defaultValue={defaults?.highlights.join("\n")}/></label>
      <label>Equipamiento <small>Formato: Categoría | Nombre | Valor opcional</small><textarea name="features" defaultValue={defaults?.features.map((feature) => `${feature.category} | ${feature.label}${feature.value ? ` | ${feature.value}` : ""}`).join("\n")}/></label>
    </section>
  </>;
}

function StickyActions({ saving, dirty, onCancel }: { saving: boolean; dirty: boolean; onCancel: () => void }) {
  return <div className="form-sticky palomin-sticky-actions">
    {dirty && <span className="palomin-dirty-note">Tienes cambios sin guardar.</span>}
    <button type="button" className="button button-secondary" onClick={onCancel}>Cancelar</button>
    <button className="button" type="submit" disabled={saving}>{saving ? <><Loader2 size={17} className="spin"/> Guardando…</> : <><Save size={17}/> Guardar</>}</button>
  </div>;
}

type BuildResult = { ok: true; data: CarJson } | { ok: false; error: string };

function buildCarJson(form: HTMLFormElement, previous?: CarJson): BuildResult {
  const raw = Object.fromEntries(new FormData(form));
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Revisa el campo ${issue.path.join(".") || "del formulario"}: ${issue.message}` };
  }
  const value = parsed.data;
  const highlights = String(raw["highlights"] ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const features = String(raw["features"] ?? "").split("\n")
    .map((row) => row.split("|").map((part) => part.trim()))
    .filter((columns) => columns[0] && columns[1])
    .map(([category, label, featureValue]) => ({ category, label, ...(featureValue ? { value: featureValue } : {}) }));
  return { ok: true, data: {
    make: value.make, model: value.model, trim: value.trim || null,
    year: value.year, price: value.price, previousPrice: value.previousPrice ?? null,
    mileageKm: value.mileageKm, transmission: value.transmission,
    fuelType: value.fuelType, drivetrain: value.drivetrain || null, engine: value.engine || null,
    bodyType: value.bodyType, exteriorColor: value.exteriorColor || null, interiorColor: value.interiorColor || null,
    doors: value.doors ?? null, seats: value.seats ?? null, horsepower: value.horsepower ?? null,
    location: value.location, status: value.status,
    featured: raw["featured"] === "on", newArrival: raw["newArrival"] === "on", opportunity: raw["opportunity"] === "on",
    description: value.description || null, highlights,
    publishedAt: previous?.publishedAt ?? null,
    images: previous?.images ?? [], features
  } };
}
