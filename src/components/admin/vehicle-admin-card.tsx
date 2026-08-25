"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Loader2, Menu, MoreVertical, Pencil, Star, StarOff, Trash2, X } from "lucide-react";
import { formatKm, formatPrice, labels } from "@/lib/format";
import type { CarFile } from "@/lib/github-admin/types";
import { vehicleName } from "@/lib/github-admin/vehicles";

export type CardActions = {
  onStatus: (car: CarFile, status: CarFile["data"]["status"]) => void;
  onToggleFeatured: (car: CarFile) => void;
  onDuplicate: (car: CarFile) => void;
  onDelete: (car: CarFile) => void;
  onPriceChange: (car: CarFile, price: number) => void;
};

export function VehicleAdminCard({ car, busy, actions }: { car: CarFile; busy: boolean; actions: CardActions }) {
  const data = car.data;
  const cover = data.images[0];
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState(String(data.price));
  function submitPrice() {
    const value = Number(price);
    if (!Number.isFinite(value) || value === data.price) return setEditingPrice(false);
    setEditingPrice(false);
    actions.onPriceChange(car, value);
  }
  return <article className={`vehicle-card palomin-card ${data.status === "SOLD" ? "sold" : ""}`}>
    <div className="card-image">
      <Link href={`/autos/${car.slug}`} aria-label={`Ver publicación pública de ${vehicleName(data)}`}>
        {cover ? <img src={cover.path} alt={cover.alt} loading="lazy"/> : <span className="image-placeholder">Foto próximamente</span>}
      </Link>
      {(data.status !== "AVAILABLE" || data.opportunity || data.newArrival || data.featured) && <span className="badge">{badgeLabel(data)}</span>}
    </div>
    <div className="palomin-card-tools">
      <Link className="icon-button" href={`/TheLastPalomin/autos/${car.slug}/`} aria-label={`Editar ${vehicleName(data)}`} title="Editar">{busy ? <Loader2 size={17} className="spin"/> : <Pencil size={17}/>}</Link>
      <details className="palomin-menu">
        <summary className="icon-button" aria-label={`Más acciones para ${vehicleName(data)}`} title="Más acciones"><MoreVertical size={17}/></summary>
        <div className="palomin-menu-body" role="menu">
          <div className="palomin-menu-group" role="group" aria-label="Estado del vehículo">
            {(["AVAILABLE", "RESERVED", "SOLD", "DRAFT"] as const).map((status) =>
              <button key={status} type="button" role="menuitem" disabled={busy} className={data.status === status ? "current" : ""} onClick={() => actions.onStatus(car, status)}>{labels.status[status]}</button>)}
          </div>
          <button type="button" role="menuitem" disabled={busy} onClick={() => actions.onToggleFeatured(car)}>{data.featured ? <><StarOff size={15}/> Quitar destacado</> : <><Star size={15}/> Destacar</>}</button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => actions.onDuplicate(car)}><Menu size={15}/> Duplicar</button>
          <button type="button" role="menuitem" className="danger" disabled={busy} onClick={() => actions.onDelete(car)}><Trash2 size={15}/> Eliminar</button>
        </div>
      </details>
    </div>
    <div className="card-body">
      <h3>{data.year} {data.make} {data.model}</h3>
      <p className="trim">{data.trim ?? "Versión estándar"}</p>
      <p className="card-specs">{formatKm(data.mileageKm)} <i/> {labels.transmission[data.transmission]} <i/> {labels.fuel[data.fuelType]}</p>
      <div className="price-row">
        {editingPrice ? <form className="palomin-price-edit" onSubmit={(event) => { event.preventDefault(); submitPrice(); }}>
          <input type="number" inputMode="numeric" min={1} value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Nuevo precio" autoFocus/>
          <button type="submit" className="icon-button" aria-label="Guardar precio"><Check size={16}/></button>
          <button type="button" className="icon-button" aria-label="Cancelar edición de precio" onClick={() => { setPrice(String(data.price)); setEditingPrice(false); }}><X size={16}/></button>
        </form> : <>
          <div>{data.previousPrice && data.previousPrice > data.price && <del>{formatPrice(data.previousPrice)}</del>}<strong>{formatPrice(data.price)}</strong></div>
          <button type="button" className="palomin-price-pencil icon-button" aria-label="Editar precio" onClick={() => setEditingPrice(true)}><Pencil size={14}/></button>
        </>}
      </div>
      <p className="location"><span className={`status palomin-status-${data.status.toLowerCase()}`}>{labels.status[data.status]}</span></p>
    </div>
  </article>;
}

function badgeLabel(data: CarFile["data"]) {
  if (data.status === "RESERVED") return "Reservado";
  if (data.status === "SOLD") return "Vendido";
  if (data.status === "DRAFT") return "Borrador";
  if (data.opportunity) return "Oportunidad";
  if (data.newArrival) return "Nuevo ingreso";
  return "Destacado";
}
