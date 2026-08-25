"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RefreshCw, Search, Star, StarOff, Trash2 } from "lucide-react";
import { GithubConnection } from "@/components/admin/github-connection";
import { useGithubToken } from "@/components/admin/token";
import { useRemoteVehicles } from "@/components/admin/use-inventory";
import { useVehicleActions } from "@/components/admin/use-vehicle-actions";
import { formatKm, formatPrice, labels } from "@/lib/format";

const filters = ["ALL", "AVAILABLE", "RESERVED", "SOLD", "DRAFT"] as const;
type Filter = (typeof filters)[number];

export default function InventoryPage() {
  const token = useGithubToken();
  if (!token) return <GithubConnection context="el inventario"/>;
  return <Inventory token={token}/>;
}

function Inventory({ token }: { token: string }) {
  const { status, data: vehicles, error, refresh } = useRemoteVehicles(token);
  const { actions, busySlug, error: actionError, dialog } = useVehicleActions(token, refresh);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => Object.fromEntries(filters.map((key) => [key, key === "ALL" ? vehicles.length : vehicles.filter((car) => car.data.status === key).length])), [vehicles]);
  const visible = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("es-CL").split(/\s+/).filter(Boolean);
    return vehicles.filter((car) => (filter === "ALL" || car.data.status === filter) && terms.every((term) => `${car.data.make} ${car.data.model} ${car.data.trim ?? ""} ${car.data.year}`.toLocaleLowerCase("es-CL").includes(term)));
  }, [vehicles, filter, query]);

  return <div className="palomin-page">
    <div className="palomin-heading">
      <div><span className="eyebrow">Inventario</span><h1>Vehículos</h1><p>Todo lo que publiques aquí se refleja en el catálogo público.</p></div>
      <Link className="button" href="/TheLastPalomin/autos/nuevo/"><Plus size={17}/> Agregar vehículo</Link>
    </div>

    {status === "loading" && <div className="palomin-kpis" aria-label="Cargando">{filters.map((key) => <div key={key} className="palomin-kpi"><strong>…</strong><span>{kpiLabel(key)}</span></div>)}</div>}
    {status === "error" && <div className="empty-state"><p>{error}</p><button className="button button-secondary" onClick={() => refresh()}><RefreshCw size={16}/> Reintentar</button></div>}

    {status === "ready" && <>
      <div className="palomin-kpis">
        {filters.map((key) => <button key={key} type="button" className={`palomin-kpi ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}><strong>{counts[key]}</strong><span>{kpiLabel(key)}</span></button>)}
      </div>

      <label className="palomin-search">
        <Search size={17}/>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar vehículo…" aria-label="Buscar vehículo"/>
      </label>

      {actionError && <p className="form-error" role="alert">{actionError}</p>}

      {visible.length ? <ul className="palomin-inventory">
        {visible.map((car) => <li key={`${car.slug}-${car.sha}`} className={`palomin-row ${busySlug === car.slug ? "busy" : ""}`}>
          <Link className="palomin-thumb" href={`/TheLastPalomin/autos/${car.slug}/`} aria-label={`Editar ${car.data.year} ${car.data.make} ${car.data.model}`}>
            {car.data.images[0] && <img src={car.data.images[0].path} alt={car.data.images[0].alt}/>}
          </Link>
          <div className="palomin-row-name">
            <strong>{car.data.make} {car.data.model}{car.data.trim ? ` ${car.data.trim}` : ""}</strong>
            <small>{car.data.year} · {formatKm(car.data.mileageKm)} · {labels.transmission[car.data.transmission]}</small>
          </div>
          <b className="palomin-row-price">{formatPrice(car.data.price)}</b>
          <span className={`status palomin-status-${car.data.status.toLowerCase()}`}>{labels.status[car.data.status]}</span>
          <div className="palomin-row-actions">
            <select value={car.data.status} onChange={(event) => actions.onStatus(car, event.target.value as typeof car.data.status)} disabled={busySlug !== null} aria-label={`Estado de ${car.data.make} ${car.data.model}`}>
              {filters.filter((key) => key !== "ALL").map((key) => <option key={key} value={key}>{labels.status[key]}</option>)}
            </select>
            <button type="button" className="icon-button" onClick={() => actions.onToggleFeatured(car)} disabled={busySlug !== null} aria-label={car.data.featured ? `Quitar destacado a ${car.data.model}` : `Destacar ${car.data.model}`} title={car.data.featured ? "Quitar destacado" : "Destacar"}>
              {car.data.featured ? <Star size={16} fill="currentColor"/> : <StarOff size={16}/>}
            </button>
            <Link className="icon-button" href={`/TheLastPalomin/autos/${car.slug}/`} aria-label={`Editar ${car.data.make} ${car.data.model}`} title="Editar"><Pencil size={16}/></Link>
            <button type="button" className="icon-button danger" onClick={() => actions.onDelete(car)} disabled={busySlug !== null} aria-label={`Eliminar ${car.data.make} ${car.data.model}`} title="Eliminar"><Trash2 size={16}/></button>
          </div>
        </li>)}
      </ul> : <div className="empty-state"><h2>Sin resultados</h2><p>No encontramos vehículos con estos filtros.</p></div>}
    </>}
    {dialog}
  </div>;
}

function kpiLabel(filter: Filter) {
  return filter === "ALL" ? "Todos" : labels.status[filter];
}
