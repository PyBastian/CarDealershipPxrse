"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { EditorGate } from "@/components/admin/editor-gate";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const emptySubscribe = () => () => {};

function editorSlugFromLocation() {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname.startsWith(basePath) ? window.location.pathname.slice(basePath.length) : window.location.pathname;
  const match = path.match(/^\/TheLastPalomin\/autos\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function NotFound() {
  const editorSlug = useSyncExternalStore(emptySubscribe, editorSlugFromLocation, () => null);
  if (editorSlug) return <div className="palomin-shell palomin-main"><EditorGate slug={editorSlug}/></div>;
  return <div className="shell empty-state not-found"><span className="eyebrow">404</span><h1>Este auto no está disponible.</h1><p>Puede haber sido retirado o la dirección cambió.</p><Link className="button" href="/autos/">Ver autos disponibles</Link></div>;
}
