"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { FilterDrawer } from "@/components/filter-drawer";
import { SortSelect } from "@/components/sort-select";
import { VehicleCard } from "@/components/vehicle-card";
import { activeFilterCount, filterVehicles, parseCatalogState } from "@/lib/catalog";
import { formatPrice, labels } from "@/lib/format";
import type { CatalogState } from "@/lib/catalog";
import type { Vehicle } from "@/lib/types";

type Params = Record<string, string | undefined>;

function FilterForm({ state, inventory }: { state: CatalogState; inventory: Vehicle[] }) {
  const makes = [...new Set(inventory.map((v) => v.make))].sort();
  const models = [...new Set(inventory.filter((v) => !state.marca || v.make === state.marca).map((v) => v.model))].sort();
  const bodies = [...new Set(inventory.map((v) => v.bodyType))];
  const transmissions = [...new Set(inventory.map((v) => v.transmission))];
  const fuels = [...new Set(inventory.map((v) => v.fuelType))];
  return <form method="get" className="filter-form">
    {state.q && <input type="hidden" name="q" value={state.q}/>}<input type="hidden" name="orden" value={state.orden}/>
    <fieldset><legend>Precio</legend><div className="range-fields"><label>Desde<input name="precioMin" inputMode="numeric" defaultValue={state.precioMin} placeholder="$0"/></label><label>Hasta<input name="precioMax" inputMode="numeric" defaultValue={state.precioMax} placeholder="$30.000.000"/></label></div></fieldset>
    <fieldset><legend>Marca</legend><select name="marca" defaultValue={state.marca ?? ""}><option value="">Todas</option>{makes.map((make) => <option key={make}>{make}</option>)}</select></fieldset>
    {models.length > 1 && <fieldset><legend>Modelo</legend><select name="modelo" defaultValue={state.modelo ?? ""}><option value="">Todos</option>{models.map((model) => <option key={model}>{model}</option>)}</select></fieldset>}
    <fieldset><legend>Año</legend><div className="range-fields"><label>Desde<input name="anioMin" inputMode="numeric" defaultValue={state.anioMin}/></label><label>Hasta<input name="anioMax" inputMode="numeric" defaultValue={state.anioMax}/></label></div></fieldset>
    <fieldset><legend>Kilometraje máximo</legend><input name="kmMax" inputMode="numeric" defaultValue={state.kmMax} placeholder="100.000"/></fieldset>
    {bodies.length > 1 && <fieldset><legend>Carrocería</legend><select name="carroceria" defaultValue={state.carroceria ?? ""}><option value="">Todas</option>{bodies.map((type) => <option value={type} key={type}>{labels.body[type]}</option>)}</select></fieldset>}
    {transmissions.length > 1 && <fieldset><legend>Transmisión</legend>{transmissions.map((type) => <label className="check-row" key={type}><input type="radio" name="transmision" value={type} defaultChecked={state.transmision === type}/>{labels.transmission[type]}<span>{inventory.filter((v) => v.transmission === type).length}</span></label>)}</fieldset>}
    {fuels.length > 1 && <fieldset><legend>Combustible</legend><select name="combustible" defaultValue={state.combustible ?? ""}><option value="">Todos</option>{fuels.map((type) => <option value={type} key={type}>{labels.fuel[type]}</option>)}</select></fieldset>}
    <button className="button filter-apply"><SlidersHorizontal size={17}/> Aplicar filtros</button>
  </form>;
}

function chipUrl(params: Params, remove: string) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (key !== remove && value) next.set(key, value); });
  return `/autos${next.size ? `?${next}` : ""}`;
}

export function CatalogBrowser({ inventory }: { inventory: Vehicle[] }) {
  const searchParams = useSearchParams();
  const raw = Object.fromEntries(searchParams.entries());
  const state = parseCatalogState(raw);
  const vehicles = filterVehicles(inventory, state);
  const chips: [string, string][] = Object.entries(state).flatMap(([key, value]) => key === "orden" || value === undefined ? [] : [[key, key === "precioMin" || key === "precioMax" ? formatPrice(Number(value)) : String(value)]]);
  return <div className="shell catalog-page">
    <div className="catalog-title"><span className="eyebrow">Inventario</span><h1>Autos disponibles</h1><p>{inventory.length} vehículos seleccionados para explorar con calma.</p></div>
    <form className="catalog-search"><Search/><input name="q" defaultValue={state.q} placeholder="Buscar marca, modelo, versión o año" aria-label="Buscar autos"/>{state.q && <Link href="/autos" aria-label="Limpiar búsqueda"><X/></Link>}<button className="button">Buscar</button></form>
    <div className="mobile-toolbar"><FilterDrawer count={activeFilterCount(state)} resultCount={vehicles.length}><FilterForm state={state} inventory={inventory}/></FilterDrawer><form>{Object.entries(raw).map(([key, value]) => key !== "orden" && value && <input key={key} type="hidden" name={key} value={value}/>)}<SortSelect value={state.orden}/></form><span>{vehicles.length} autos</span></div>
    <div className="catalog-layout">
      <aside className="filter-sidebar"><div className="sidebar-title"><h2>Filtros</h2>{chips.length > 0 && <Link href="/autos">Limpiar</Link>}</div><FilterForm state={state} inventory={inventory}/></aside>
      <div className="catalog-results">
        <div className="results-head"><span>{vehicles.length} {vehicles.length === 1 ? "vehículo" : "vehículos"}</span><form>{Object.entries(raw).map(([key, value]) => key !== "orden" && value && <input key={key} type="hidden" name={key} value={value}/>)}<label>Ordenar por <SortSelect value={state.orden}/></label></form></div>
        {chips.length > 0 && <div className="chips">{chips.map(([key, label]) => <Link key={key} href={chipUrl(raw, key)}>{label}<X size={14}/></Link>)}</div>}
        {vehicles.length ? <div className="vehicle-grid">{vehicles.map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3}/>)}</div> : <div className="empty-state"><Search/><h2>No encontramos autos con estos filtros.</h2><p>Prueba ajustando el precio, año o kilometraje.</p><Link className="button" href="/autos">Limpiar filtros</Link></div>}
      </div>
    </div>
  </div>;
}
