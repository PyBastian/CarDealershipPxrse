"use client";

import { ArrowRight, MessageCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { GithubConnection } from "@/components/admin/github-connection";
import { VehicleAdminCard } from "@/components/admin/vehicle-admin-card";
import { useGithubToken } from "@/components/admin/token";
import { useRemoteSettings, useRemoteVehicles } from "@/components/admin/use-inventory";
import { useVehicleActions } from "@/components/admin/use-vehicle-actions";
import { vehicleName } from "@/lib/github-admin/vehicles";

export default function AdminHomePage() {
  const token = useGithubToken();
  if (!token) return <GithubConnection/>;
  return <CatalogHome token={token}/>;
}

function CatalogHome({ token }: { token: string }) {
  const { status, data: vehicles, error, refresh } = useRemoteVehicles(token);
  const { data: settings } = useRemoteSettings(token);
  const { actions, busySlug, error: actionError, dialog } = useVehicleActions(token, refresh);

  const published = vehicles.filter((car) => car.data.status !== "DRAFT");
  const hero = vehicles[0];
  const featured = [...vehicles].sort((a, b) => Number(b.data.featured) - Number(a.data.featured)).slice(0, 8);
  const whatsapp = `https://wa.me/${settings?.whatsappNumber ?? "56944125897"}`;

  return <div className="palomin-page">
    <section className="hero palomin-hero">
      <div className="hero-copy">
        <span className="eyebrow">Modo administrador</span>
        <h1>Tu concesionario, editable.</h1>
        <p>Estás viendo el mismo catálogo que tus clientes. Usa los controles para editar precios, estados y fotos; cada cambio se guarda como un commit en GitHub.</p>
        <div className="palomin-hero-actions">
          <Link className="button" href="/TheLastPalomin/autos/nuevo/"><Plus size={17}/> Agregar vehículo</Link>
          <Link className="button button-secondary" href="/TheLastPalomin/inventario/">Ver inventario</Link>
        </div>
      </div>
      {hero && <Link href={`/TheLastPalomin/autos/${hero.slug}/`} className="hero-visual">
        {hero.data.images[0] && <img src={hero.data.images[0].path} alt={hero.data.images[0].alt}/>}
        <span><small>Editar</small>{vehicleName(hero.data)}<ArrowRight/></span>
      </Link>}
    </section>

    {status === "loading" && <div className="loading-grid shell" aria-label="Cargando catálogo">{Array.from({ length: 4 }, (_, index) => <div key={index}/>)}</div>}

    {status === "error" && <div className="empty-state shell"><p>{error}</p><button className="button button-secondary" onClick={() => refresh()}><RefreshCw size={16}/> Reintentar</button></div>}

    {status === "ready" && <>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <section className="section shell palomin-home-grid-section">
        <div className="section-heading"><div><span className="eyebrow">Catálogo</span><h2>Vehículos ({published.length})</h2></div><Link href="/TheLastPalomin/inventario/">Gestionar inventario <ArrowRight size={16}/></Link></div>
        {featured.length ? <div className="vehicle-grid home-grid">{featured.map((car) => <VehicleAdminCard key={`${car.slug}-${car.sha}`} car={car} busy={busySlug === car.slug} actions={actions}/>)}</div> : <div className="empty-state"><h2>Catálogo vacío</h2><p>Agrega tu primer vehículo para comenzar.</p><Link className="button" href="/TheLastPalomin/autos/nuevo/"><Plus size={17}/> Agregar vehículo</Link></div>}
      </section>

      <section className="contact-banner shell"><div><span className="eyebrow">¿Buscas algo específico?</span><h2>Conversemos directamente.</h2><p>Cuéntanos qué auto tienes en mente y te ayudamos a revisar la colección.</p></div><a className="button" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle/> Escribir por WhatsApp</a></section>
    </>}
    {dialog}
  </div>;
}
