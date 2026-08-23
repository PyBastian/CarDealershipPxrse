import Link from "next/link";
import { getSettings } from "@/lib/data";

export async function Footer() {
  const settings = await getSettings();
  return <footer className="footer"><div className="shell footer-grid">
    <div><div className="brand"><span className="brand-mark">LP</span>{settings.brandName}</div><p>{settings.siteDescription}</p></div>
    <div><span className="eyebrow">Explora</span><Link href="/autos">Autos disponibles</Link><Link href="/contacto">Contacto</Link>{process.env.NEXT_PUBLIC_STATIC_SITE !== "true" && <Link href="/admin">Administración</Link>}</div>
    <div><span className="eyebrow">Contacto</span>{settings.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}{settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}<span>{settings.locationText}</span></div>
  </div><div className="shell footer-bottom">© {new Date().getFullYear()} {settings.brandName}. Inventario de demostración.</div></footer>;
}
