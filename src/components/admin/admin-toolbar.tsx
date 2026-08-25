"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { publicSiteUrl } from "@/lib/base-path";
import { disconnectToken, useGithubToken } from "./token";

const links = [
  { href: "/TheLastPalomin", label: "Sitio" },
  { href: "/TheLastPalomin/inventario", label: "Inventario" },
  { href: "/TheLastPalomin/configuracion", label: "Configuración" }
];

export function AdminToolbar() {
  const token = useGithubToken();
  const pathname = usePathname();
  return <div className="palomin-toolbar">
    <div className="shell palomin-toolbar-inner">
      <span className="brand"><span className="brand-mark">LP</span>THE LAST PALOMIN<span className={`palomin-dot ${token ? "on" : ""}`} aria-hidden/></span>
      <nav className="palomin-nav" aria-label="Administración">
        {links.map((link) => {
          const active = link.href === "/TheLastPalomin" ? pathname === link.href : pathname.startsWith(link.href);
          return <Link key={link.href} href={link.href} className={active ? "active" : ""}>{link.label}</Link>;
        })}
      </nav>
      <div className="palomin-toolbar-status">
        <span className="palomin-connection">{token ? <>GitHub conectado</> : <>Sin conexión GitHub</>}</span>
        <a className="palomin-public-link" href={publicSiteUrl("/")} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Ver sitio público</a>
        {token && <button type="button" className="icon-button palomin-disconnect" onClick={disconnectToken} aria-label="Desconectar GitHub" title="Desconectar GitHub"><LogOut size={16}/></button>}
      </div>
    </div>
  </div>;
}
