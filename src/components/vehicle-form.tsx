"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { duplicateVehicle, saveVehicle, setVehicleStatus, softDeleteVehicle } from "@/app/(admin)/admin/autos/actions";

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const form = useRef<HTMLFormElement>(null);
  const draftKey = `vehicle-draft:${vehicle?.id ?? "new"}:v1`;
  const [draft, setDraft] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setDraft(Boolean(localStorage.getItem(draftKey)))); return () => clearTimeout(timer); }, [draftKey]);
  function persist() {
    if (!form.current) return;
    const values = Object.fromEntries([...new FormData(form.current)].filter(([, value]) => typeof value === "string"));
    localStorage.setItem(draftKey, JSON.stringify(values)); setDraft(true);
  }
  function recover() {
    if (!form.current) return;
    const values = JSON.parse(localStorage.getItem(draftKey) ?? "{}");
    Object.entries(values).forEach(([name, value]) => { const input = form.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null; if (input) input.value = String(value); });
    setDraft(false);
  }
  const action = saveVehicle.bind(null, vehicle?.id);
  return <>
    {draft && <div className="draft-banner">Encontramos cambios sin guardar.<span><button type="button" onClick={recover}>Recuperar borrador</button><button type="button" onClick={() => { localStorage.removeItem(draftKey); setDraft(false); }}>Descartar</button></span></div>}
    <form ref={form} action={action} className="vehicle-form" onInput={persist} onSubmit={() => localStorage.removeItem(draftKey)}>
      <section><h2>Básico</h2><div className="form-grid"><label>Marca<input required name="make" defaultValue={vehicle?.make}/></label><label>Modelo<input required name="model" defaultValue={vehicle?.model}/></label><label>Versión<input name="trim" defaultValue={vehicle?.trim ?? ""}/></label><label>Año<input required type="number" name="year" min="1950" max="2030" defaultValue={vehicle?.year ?? new Date().getFullYear()}/></label><label>Precio<input required type="number" name="price" min="1" defaultValue={vehicle?.price}/></label><label>Precio anterior<input type="number" name="previousPrice" min="1" defaultValue={vehicle?.previousPrice ?? ""}/></label><label>Kilometraje<input required type="number" name="mileageKm" min="0" defaultValue={vehicle?.mileageKm ?? 0}/></label></div></section>
      <section><h2>Mecánica</h2><div className="form-grid"><label>Transmisión<select name="transmission" defaultValue={vehicle?.transmission ?? "AUTOMATIC"}><option value="AUTOMATIC">Automática</option><option value="MANUAL">Manual</option></select></label><label>Combustible<select name="fuelType" defaultValue={vehicle?.fuelType ?? "GASOLINE"}><option value="GASOLINE">Bencina</option><option value="DIESEL">Diésel</option><option value="HYBRID">Híbrido</option><option value="ELECTRIC">Eléctrico</option><option value="OTHER">Otro</option></select></label><label>Motor<input name="engine" defaultValue={vehicle?.engine ?? ""}/></label><label>Tracción<input name="drivetrain" defaultValue={vehicle?.drivetrain ?? ""}/></label><label>Potencia (hp)<input type="number" name="horsepower" defaultValue={vehicle?.horsepower ?? ""}/></label></div></section>
      <section><h2>Carrocería</h2><div className="form-grid"><label>Tipo<select name="bodyType" defaultValue={vehicle?.bodyType ?? "SUV"}><option>SUV</option><option value="SEDAN">Sedán</option><option value="HATCHBACK">Hatchback</option><option value="PICKUP">Pickup</option><option value="WAGON">Station Wagon</option><option value="COUPE">Coupé</option><option value="VAN">Van</option><option value="OTHER">Otro</option></select></label><label>Color exterior<input name="exteriorColor" defaultValue={vehicle?.exteriorColor ?? ""}/></label><label>Color interior<input name="interiorColor" defaultValue={vehicle?.interiorColor ?? ""}/></label><label>Puertas<input type="number" name="doors" min="1" defaultValue={vehicle?.doors ?? ""}/></label><label>Asientos<input type="number" name="seats" min="1" defaultValue={vehicle?.seats ?? ""}/></label></div></section>
      <section><h2>Publicación</h2><div className="form-grid"><label>Ubicación<input required name="location" defaultValue={vehicle?.location ?? "Santiago, Región Metropolitana"}/></label><label>Estado<select name="status" defaultValue={vehicle?.status ?? "DRAFT"}><option value="DRAFT">Borrador</option><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservado</option><option value="SOLD">Vendido</option></select></label></div><label>Descripción<textarea name="description" defaultValue={vehicle?.description ?? ""}/></label><div className="form-checks"><label><input type="checkbox" name="featured" defaultChecked={vehicle?.featured}/> Destacado</label><label><input type="checkbox" name="newArrival" defaultChecked={vehicle?.newArrival}/> Nuevo ingreso</label><label><input type="checkbox" name="opportunity" defaultChecked={vehicle?.opportunity}/> Oportunidad</label></div></section>
      <section><h2>Características y equipamiento</h2><label>Destacados <small>Uno por línea</small><textarea name="highlights" defaultValue={vehicle?.highlights.join("\n")}/></label><label>Equipamiento <small>Formato: Categoría | Nombre | Valor opcional</small><textarea name="features" defaultValue={vehicle?.features.map((feature) => `${feature.category} | ${feature.label}${feature.value ? ` | ${feature.value}` : ""}`).join("\n")}/></label></section>
      <section><h2>Fotos</h2>{vehicle?.images.length ? <div className="admin-photo-grid">{vehicle.images.map((image) => <div key={image.id}><Image src={image.url} alt={image.alt} fill sizes="160px"/>{image.isCover && <span>PORTADA</span>}</div>)}</div> : <p className="form-help">Aún no hay fotos.</p>}<label className="dropzone"><ImagePlus/> <span>Arrastra o selecciona fotos<small>JPG, PNG, WebP o AVIF · máximo 10 MB</small></span><input type="file" name="photos" accept="image/jpeg,image/png,image/webp,image/avif" multiple/></label><input type="hidden" name="imageUrls" defaultValue={vehicle?.images.map((image) => image.url).join("\n")}/></section>
      <section><h2>Información interna</h2><label>Notas privadas<textarea name="internalNotes" defaultValue={vehicle?.internalNotes ?? ""}/></label><p className="form-help">Nunca se muestran en el sitio público.</p></section>
      <div className="form-sticky"><button className="button" type="submit"><Save/> Guardar auto</button></div>
    </form>
    {vehicle && <div className="danger-zone"><div><h2>Acciones rápidas</h2><p>Cambiar estado, duplicar o retirar este registro.</p></div><div><form action={setVehicleStatus.bind(null, vehicle.id, vehicle.status === "RESERVED" ? "AVAILABLE" : "RESERVED")}><button className="button button-secondary">{vehicle.status === "RESERVED" ? "Marcar disponible" : "Marcar reservado"}</button></form><form action={setVehicleStatus.bind(null, vehicle.id, "SOLD")}><button className="button button-secondary">Marcar vendido</button></form><form action={duplicateVehicle.bind(null, vehicle.id)}><button className="button button-secondary">Duplicar</button></form><form action={softDeleteVehicle.bind(null, vehicle.id)} onSubmit={(event) => { if (!confirm("¿Eliminar este auto? Se retirará del sitio público.")) event.preventDefault(); }}><button className="button danger"><Trash2/> Eliminar</button></form></div></div>}
  </>;
}
