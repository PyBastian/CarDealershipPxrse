"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { settingsSchema } from "@/lib/car-json";
import { GithubError } from "@/lib/github-admin/client";
import { getSettings, saveSettings } from "@/lib/github-admin/settings";
import { SaveBanner, type SaveState } from "./save-state";

export function SettingsEditor({ token }: { token: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [state, setState] = useState<SaveState>({ kind: "saving", message: "Cargando configuración…" });

  useEffect(() => {
    getSettings(token)
      .then(({ data, sha }) => {
        setSha(sha);
        setState({ kind: "idle" });
        if (!formRef.current) return;
        for (const [key, value] of Object.entries(data)) {
          const input = formRef.current.elements.namedItem(key);
          if (input instanceof HTMLInputElement) {
            if (input.type === "checkbox") input.checked = Boolean(value);
            else input.value = String(value ?? "");
          }
        }
      })
      .catch((cause) => setState({ kind: "error", message: cause instanceof Error ? cause.message : "No pudimos cargar la configuración." }));
  }, [token]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!formRef.current || state.kind === "saving") return;
    const raw = Object.fromEntries(new FormData(formRef.current));
    const candidate: Record<string, unknown> = {
      brandName: raw["brandName"], whatsappNumber: String(raw["whatsappNumber"] ?? "").replace(/[^\d]/g, ""),
      phone: raw["phone"] || null, email: raw["email"] || null, instagramUrl: raw["instagramUrl"] || null,
      locationText: raw["locationText"] || null, siteTitle: raw["siteTitle"], siteDescription: raw["siteDescription"],
      showSold: raw["showSold"] === "on"
    };
    const parsed = settingsSchema.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setState({ kind: "error", message: `Revisa el campo ${issue.path.join(".")}: ${issue.message}` });
      return;
    }
    if (!sha) { setState({ kind: "error", message: "No pudimos leer settings.json. Recarga la página." }); return; }
    setState({ kind: "saving", message: "Guardando…" });
    try {
      await saveSettings(parsed.data, sha, token);
      const fresh = await getSettings(token);
      setSha(fresh.sha);
      setState({ kind: "success" });
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof GithubError || cause instanceof Error ? cause.message : "No pudimos guardar." });
    }
  }

  return <div className="palomin-page palomin-narrow">
    <div className="palomin-heading"><div><span className="eyebrow">Configuración</span><h1>Concesionario</h1><p>inventory/settings.json</p></div></div>
    <SaveBanner state={state}/>
    <form ref={formRef} className="vehicle-form" onSubmit={handleSave}>
      <section><h2>Identidad</h2><div className="form-grid">
        <label>Nombre del concesionario<input required name="brandName"/></label>
        <label>Ubicación<input name="locationText"/></label>
        <label className="inline-check palomin-check-field"><input type="checkbox" name="showSold"/> Mostrar vehículos vendidos en el catálogo</label>
      </div></section>
      <section><h2>Contacto</h2><div className="form-grid">
        <label>WhatsApp <small>Solo números con código de país</small><input required name="whatsappNumber" inputMode="numeric"/></label>
        <label>Teléfono<input name="phone"/></label>
        <label>Correo<input type="email" name="email"/></label>
        <label>Instagram<input type="url" name="instagramUrl"/></label>
      </div></section>
      <section><h2>Sitio</h2>
        <label>Título del sitio<input required name="siteTitle"/></label>
        <label className="palomin-mt">Descripción del sitio<textarea required name="siteDescription" style={{ minHeight: 80 }}/></label>
      </section>
      <div className="form-sticky palomin-sticky-actions">
        <button className="button" type="submit" disabled={state.kind === "saving"}>{state.kind === "saving" ? <><Loader2 size={17} className="spin"/> Guardando…</> : <><Save size={17}/> Guardar configuración</>}</button>
      </div>
    </form>
  </div>;
}
