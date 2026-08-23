"use client";

export function SortSelect({ value }: { value: string }) {
  return <select name="orden" value={value} onChange={(event) => event.currentTarget.form?.requestSubmit()} aria-label="Ordenar autos">
    <option value="recommended">Recomendados</option><option value="recent">Más recientes</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="km-asc">Menor kilometraje</option><option value="km-desc">Mayor kilometraje</option><option value="year-desc">Año más nuevo</option><option value="year-asc">Año más antiguo</option>
  </select>;
}
