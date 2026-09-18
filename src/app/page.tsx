import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AtSign, MessageCircle } from "lucide-react";
import { getPublicVehicles, getSettings } from "@/lib/data";
import { withBasePath } from "@/lib/base-path";
import instagramPosts from "@/data/instagram.json";

export default async function HomePage() {
  const [vehicles, settings] = await Promise.all([getPublicVehicles(), getSettings()]);
  const hero = vehicles[0];
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(hero ? `Hola, quiero consultar y coordinar una inspección para el ${hero.make} ${hero.model} ${hero.year}.` : "Hola, quiero consultar por los vehículos disponibles.")}`;
  return <>
    <section className="hero shell">
      <div className="hero-copy"><span className="eyebrow">Compra y venta de vehículos</span><h1>Encuentra tu próximo auto.</h1><p>Vehículos seleccionados en Santiago, información clara y cotización directa por WhatsApp.</p>
        <div className="hero-actions"><Link className="button" href={hero ? `/autos/${hero.slug}` : "/autos"}>Ver ficha y fotos <ArrowRight size={17}/></Link><a className="button button-secondary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Coordinar inspección</a></div>
      </div>
      <Link href={hero ? `/autos/${hero.slug}` : "/autos"} className="hero-visual"><Image src={hero?.images[0]?.url ?? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vehicles/suv-graphite.png`} alt={hero?.images[0]?.alt ?? "Vehículo disponible"} fill loading="eager" sizes="(max-width: 800px) 100vw, 56vw"/><span><small>Disponible para inspección</small>{hero?.year} {hero?.make} {hero?.model}<ArrowRight/></span></Link>
    </section>

    <section className="section shell instagram-section"><div className="section-heading"><div><span className="eyebrow">Instagram</span><h2>Publicaciones recientes</h2></div><a href={settings.instagramUrl ?? "https://www.instagram.com/mkcars.cl/"} target="_blank" rel="noreferrer">@mkcars.cl <AtSign size={16}/></a></div><div className="instagram-grid">{instagramPosts.slice(1).map((post) => <a className="instagram-card" href={post.url} target="_blank" rel="noreferrer" key={post.shortcode}><span className="instagram-image"><Image src={withBasePath(post.image)} alt={post.title} fill sizes="(max-width: 700px) 100vw, 50vw"/></span><span className="instagram-copy"><small>@mkcars.cl</small><strong>{post.title}</strong><span>Ver publicación <ArrowRight size={15}/></span></span></a>)}</div></section>
  </>;
}
