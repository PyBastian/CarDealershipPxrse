import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Search } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import { getPublicVehicles, getSettings } from "@/lib/data";
import { labels } from "@/lib/format";

export default async function HomePage() {
  const [vehicles, settings] = await Promise.all([getPublicVehicles(), getSettings()]);
  const featured = vehicles.filter((v) => v.featured).slice(0, 4);
  const recent = [...vehicles].sort((a, b) => +new Date(b.publishedAt ?? 0) - +new Date(a.publishedAt ?? 0)).slice(0, 4);
  const types = [...new Set(vehicles.map((v) => v.bodyType))];
  return <>
    <section className="hero shell">
      <div className="hero-copy"><span className="eyebrow">Colección seleccionada</span><h1>Encuentra tu próximo auto.</h1><p>Una selección acotada, información clara y contacto directo. Sin ruido.</p>
        <form action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/autos/`} className="hero-search"><Search/><input name="q" placeholder="Buscar marca o modelo" aria-label="Buscar marca o modelo"/><button className="button">Buscar</button></form>
        <Link className="text-link" href="/autos">Ver todos los autos <ArrowRight size={17}/></Link>
      </div>
      <Link href={`/autos/${vehicles[0]?.slug ?? ""}`} className="hero-visual"><Image src={vehicles[0]?.images[0]?.url ?? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vehicles/suv-graphite.png`} alt={vehicles[0]?.images[0]?.alt ?? "SUV grafito en estudio oscuro"} fill preload sizes="(max-width: 800px) 100vw, 56vw"/><span><small>Destacado</small>{vehicles[0]?.year} {vehicles[0]?.make} {vehicles[0]?.model}<ArrowRight/></span></Link>
    </section>

    <section className="section shell"><div className="section-heading"><div><span className="eyebrow">Selección</span><h2>Destacados</h2></div><Link href="/autos">Ver inventario <ArrowRight size={16}/></Link></div><div className="vehicle-grid home-grid">{featured.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle}/>)}</div></section>

    <section className="section shell browse"><span className="eyebrow">Explora por tipo</span><div className="type-row">{types.map((type) => <Link href={`/autos?carroceria=${type}`} key={type}>{labels.body[type]} <span>{vehicles.filter((v) => v.bodyType === type).length}</span></Link>)}</div></section>

    <section className="section shell"><div className="trust-grid">{["Información transparente", "Contacto directo", "Vehículos seleccionados", "Visita coordinada"].map((item) => <div key={item}><Check/><span>{item}</span></div>)}</div></section>

    <section className="section shell"><div className="section-heading"><div><span className="eyebrow">Recién publicados</span><h2>Últimos ingresos</h2></div></div><div className="vehicle-grid home-grid">{recent.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle}/>)}</div></section>

    <section className="contact-banner shell"><div><span className="eyebrow">¿Buscas algo específico?</span><h2>Conversemos directamente.</h2><p>Cuéntanos qué auto tienes en mente y te ayudamos a revisar la colección.</p></div><a className="button" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle/> Escribir por WhatsApp</a></section>
  </>;
}
