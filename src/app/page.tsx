import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import { getPublicVehicles, getSettings } from "@/lib/data";

export default async function HomePage() {
  const [vehicles, settings] = await Promise.all([getPublicVehicles(), getSettings()]);
  const featured = vehicles.filter((v) => v.featured).slice(0, 4);
  return <>
    <section className="hero shell">
      <div className="hero-copy"><span className="eyebrow">Colección seleccionada</span><h1>Encuentra tu próximo auto.</h1><p>Una selección acotada, información clara y contacto directo. Sin ruido.</p>
        <Link className="button" href="/autos">Ver autos disponibles <ArrowRight size={17}/></Link>
      </div>
      <Link href={`/autos/${vehicles[0]?.slug ?? ""}`} className="hero-visual"><Image src={vehicles[0]?.images[0]?.url ?? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vehicles/suv-graphite.png`} alt={vehicles[0]?.images[0]?.alt ?? "SUV grafito en estudio oscuro"} fill preload sizes="(max-width: 800px) 100vw, 56vw"/><span><small>Destacado</small>{vehicles[0]?.year} {vehicles[0]?.make} {vehicles[0]?.model}<ArrowRight/></span></Link>
    </section>

    <section className="section shell home-featured"><div className="section-heading"><div><span className="eyebrow">Selección</span><h2>Destacados</h2></div><Link href="/autos">Ver inventario <ArrowRight size={16}/></Link></div><div className="vehicle-grid home-grid">{featured.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle}/>)}</div></section>

    <section className="contact-banner shell"><div><span className="eyebrow">¿Buscas algo específico?</span><h2>Conversemos directamente.</h2><p>Cuéntanos qué auto tienes en mente y te ayudamos a revisar la colección.</p></div><a className="button" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle/> Escribir por WhatsApp</a></section>
  </>;
}
