import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/data";

export async function Header() {
  const settings = await getSettings();
  const whatsapp = `https://wa.me/${settings.whatsappNumber}`;
  return <header className="site-header">
    <div className="shell header-inner">
      <Link href="/" className="brand" aria-label={`${settings.brandName}, inicio`}><span className="brand-mark">N</span>{settings.brandName}</Link>
      <nav className="desktop-nav" aria-label="Navegación principal">
        <Link href="/">Inicio</Link><Link href="/autos">Autos</Link><Link href="/contacto">Contacto</Link>
      </nav>
      <a className="button button-small header-contact" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17}/> WhatsApp</a>
      <details className="mobile-menu"><summary aria-label="Abrir menú"><Menu/></summary><nav><Link href="/">Inicio</Link><Link href="/autos">Autos</Link><Link href="/contacto">Contacto</Link><a href={whatsapp}>WhatsApp</a></nav></details>
    </div>
  </header>;
}
