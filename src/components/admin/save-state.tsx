"use client";

import { CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react";

export type SaveState = { kind: "idle" | "saving" | "success" | "error"; message?: string };

export function SaveBanner({ state }: { state: SaveState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "saving") return <div className="palomin-banner palomin-banner-saving" role="status"><Loader2 size={17} className="spin"/> {state.message ?? "Guardando…"}</div>;
  if (state.kind === "success") return <div className="success-banner" role="status"><CheckCircle2 size={17}/> {state.message ?? "Cambios guardados. GitHub está reconstruyendo el sitio público."}</div>;
  return <div className="palomin-banner palomin-banner-error" role="alert">{state.kind === "error" ? <TriangleAlert size={17}/> : <Info size={17}/>} {state.message}</div>;
}
