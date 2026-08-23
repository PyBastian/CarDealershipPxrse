"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export function FilterDrawer({ count, resultCount, children }: { count: number; resultCount: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  return <>
    <button className="toolbar-button" onClick={() => ref.current?.showModal()}><SlidersHorizontal size={18}/> Filtros{count ? ` · ${count}` : ""}</button>
    <dialog className="filter-dialog" ref={ref} onClick={(event) => { if (event.target === ref.current) ref.current.close(); }}>
      <div className="drawer-head"><span className="drawer-handle"/><h2>Filtros</h2><button className="icon-button" onClick={() => ref.current?.close()} aria-label="Cerrar filtros"><X/></button></div>
      <div className="drawer-content">{children}</div>
      <div className="drawer-actions"><button className="button button-ghost" onClick={() => router.push("/autos")}>Limpiar</button><button className="button" onClick={() => { const form = ref.current?.querySelector("form"); form?.requestSubmit(); }}>Ver {resultCount} autos</button></div>
    </dialog>
  </>;
}
