import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Fuel, Gauge, Mail, MapPin, MessageCircle, Phone, Settings2 } from "lucide-react";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { Gallery } from "@/components/gallery";
import { ShareButton } from "@/components/share-button";
import { VehicleCard } from "@/components/vehicle-card";
import { relatedVehicles } from "@/lib/catalog";
import { getAllPublicForSitemap, getPublicVehicles, getSettings, getVehicleBySlug } from "@/lib/data";
import { formatKm, formatPrice, labels } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllPublicForSitemap()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vehicle = await getVehicleBySlug((await params).slug);
  if (!vehicle) return {};
  const settings = await getSettings();
  const title = `${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ""} ${vehicle.year} usado | ${settings.brandName}`;
  const description = `${vehicle.make} ${vehicle.model} ${vehicle.year}, ${formatKm(vehicle.mileageKm)}, ${labels.transmission[vehicle.transmission].toLowerCase()}. Consulta disponibilidad y precio.`;
  return { title, description, alternates: { canonical: `/autos/${vehicle.slug}` }, openGraph: { title, description, images: vehicle.images[0]?.url ? [vehicle.images[0].url] : [] } };
}

export default async function VehiclePage({ params }: Props) {
  const vehicle = await getVehicleBySlug((await params).slug);
  if (!vehicle) notFound();
  const [settings, inventory] = await Promise.all([getSettings(), getPublicVehicles()]);
  const related = relatedVehicles(vehicle, inventory);
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/autos/${vehicle.slug}`;
  const message = encodeURIComponent(`Hola, me interesa el ${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ""} ${vehicle.year} publicado en ${pageUrl}. ¿Sigue disponible?`);
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${message}`;
  const grouped = Object.groupBy(vehicle.features, (feature) => feature.category);
  const schema = { "@context": "https://schema.org", "@type": "Vehicle", name: title, image: vehicle.images.map((image) => `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${image.url}`), vehicleModelDate: String(vehicle.year), mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileageKm, unitCode: "KMT" }, fuelType: labels.fuel[vehicle.fuelType], vehicleTransmission: labels.transmission[vehicle.transmission], offers: { "@type": "Offer", priceCurrency: "CLP", price: vehicle.price, availability: vehicle.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" } };
  return <div className="detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}/>
    <div className="shell breadcrumb"><Link href="/autos"><ArrowLeft/> Volver a autos</Link><span>Autos / {vehicle.make} / {vehicle.model}</span></div>
    <div className="shell detail-top">
      <Gallery images={vehicle.images} name={title}/>
      <aside className="vehicle-panel">
        <div className="panel-actions"><FavoriteButton id={vehicle.id}/><ShareButton title={title}/></div>
        <span className="eyebrow">{vehicle.year}</span><h1>{vehicle.make} {vehicle.model}</h1><p className="detail-trim">{vehicle.trim}</p>
        <div className="detail-key-specs"><span><Gauge/> {formatKm(vehicle.mileageKm)}</span><span><Settings2/> {labels.transmission[vehicle.transmission]}</span><span><Fuel/> {labels.fuel[vehicle.fuelType]}</span></div>
        {vehicle.previousPrice && vehicle.previousPrice > vehicle.price && <del>{formatPrice(vehicle.previousPrice)}</del>}<strong className="detail-price">{formatPrice(vehicle.price)}</strong>
        <span className={`status status-${vehicle.status.toLowerCase()}`}>{labels.status[vehicle.status]}</span>
        {vehicle.status === "SOLD" ? <div className="sold-note"><h2>Este vehículo ya fue vendido.</h2><p>Revisa alternativas disponibles en nuestra colección.</p><Link className="button" href="/autos">Ver autos disponibles</Link></div> : <div className="panel-ctas"><a className="button" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle/> Consultar por WhatsApp</a>{settings.phone && <a className="button button-secondary" href={`tel:${settings.phone}`}><Phone/> Llamar</a>}{settings.email && <a className="text-link" href={`mailto:${settings.email}`}><Mail/> Enviar correo</a>}</div>}
        <p className="panel-location"><MapPin/> {vehicle.location}<small>La ubicación exacta se coordina al agendar.</small></p>
      </aside>
    </div>

    <div className="shell detail-content">
      {vehicle.highlights.length > 0 && <section><span className="eyebrow">Lo principal</span><h2>Características destacadas</h2><div className="highlights">{vehicle.highlights.map((item) => <span key={item}><Check/> {item}</span>)}</div></section>}
      <section><span className="eyebrow">Información</span><h2>Sobre este auto</h2>{vehicle.description?.split("\n").filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>
      <section><span className="eyebrow">Ficha</span><h2>Especificaciones</h2><dl className="spec-grid"><div><dt>Kilometraje</dt><dd>{formatKm(vehicle.mileageKm)}</dd></div><div><dt>Transmisión</dt><dd>{labels.transmission[vehicle.transmission]}</dd></div><div><dt>Combustible</dt><dd>{labels.fuel[vehicle.fuelType]}</dd></div><div><dt>Motor</dt><dd>{vehicle.engine ?? "Consultar"}</dd></div><div><dt>Tracción</dt><dd>{vehicle.drivetrain ?? "Consultar"}</dd></div><div><dt>Carrocería</dt><dd>{labels.body[vehicle.bodyType]}</dd></div><div><dt>Color</dt><dd>{vehicle.exteriorColor ?? "Consultar"}</dd></div><div><dt>Pasajeros</dt><dd>{vehicle.seats ?? "Consultar"}</dd></div></dl></section>
      {Object.keys(grouped).length > 0 && <section><span className="eyebrow">Detalle</span><h2>Equipamiento</h2><div className="equipment">{Object.entries(grouped).map(([category, features]) => <details key={category}><summary>{category}<ChevronDown/></summary><ul>{features?.map((feature) => <li key={feature.id}><Check/> {feature.label}{feature.value && `: ${feature.value}`}</li>)}</ul></details>)}</div></section>}
    </div>
    {related.length > 0 && <section className="section shell"><div className="section-heading"><div><span className="eyebrow">Alternativas</span><h2>También te pueden interesar</h2></div></div><div className="vehicle-grid home-grid">{related.map((item) => <VehicleCard key={item.id} vehicle={item}/>)}</div></section>}
    {vehicle.status !== "SOLD" && <div className="mobile-sticky-cta"><strong>{formatPrice(vehicle.price)}</strong><a className="button" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle/> Consultar</a></div>}
  </div>;
}
