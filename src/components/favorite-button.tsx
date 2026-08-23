"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

const key = "used-car-favorites:v1";

export function FavoriteButton({ id, className = "" }: { id: string; className?: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { setActive(JSON.parse(localStorage.getItem(key) ?? "[]").includes(id)); } catch {} }); return () => clearTimeout(timer); }, [id]);
  function toggle() {
    const values: string[] = (() => { try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; } })();
    const next = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
    localStorage.setItem(key, JSON.stringify(next));
    setActive(next.includes(id));
  }
  return <button type="button" onClick={toggle} className={`icon-button ${className} ${active ? "active" : ""}`} aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"} aria-pressed={active}><Heart fill={active ? "currentColor" : "none"}/></button>;
}
