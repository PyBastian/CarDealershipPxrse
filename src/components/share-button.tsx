"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) await navigator.share({ title, url: location.href });
    else { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  }
  return <><button className="icon-button" onClick={share} aria-label="Compartir vehículo"><Share2/></button>{copied && <span className="toast" role="status">Enlace copiado</span>}</>;
}
