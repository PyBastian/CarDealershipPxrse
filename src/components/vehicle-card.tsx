import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { FavoriteButton } from "./favorite-button";
import { formatKm, formatPrice, labels } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

export function VehicleCard({ vehicle, priority = false }: { vehicle: Vehicle; priority?: boolean }) {
  const cover = vehicle.images.find((image) => image.isCover) ?? vehicle.images[0];
  const badge = vehicle.status === "RESERVED" ? "Reservado" : vehicle.status === "SOLD" ? "Vendido" : vehicle.opportunity ? "Oportunidad" : vehicle.newArrival ? "Nuevo ingreso" : vehicle.featured ? "Destacado" : null;
  return <article className={`vehicle-card ${vehicle.status === "SOLD" ? "sold" : ""}`}>
    <Link href={`/autos/${vehicle.slug}`} className="card-link" aria-label={`Ver ${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
      <div className="card-image">
        {cover ? <Image src={cover.url} alt={cover.alt} fill loading={priority ? "eager" : "lazy"} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"/> : <div className="image-placeholder">Foto próximamente</div>}
        {badge && <span className="badge">{badge}</span>}
      </div>
      <div className="card-body">
        <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        <p className="trim">{vehicle.trim ?? "Versión estándar"}</p>
        <p className="card-specs">{formatKm(vehicle.mileageKm)} <i/> {labels.transmission[vehicle.transmission]} <i/> {labels.fuel[vehicle.fuelType]}</p>
        <div className="price-row"><div>{vehicle.previousPrice && vehicle.previousPrice > vehicle.price && <del>{formatPrice(vehicle.previousPrice)}</del>}<strong>{formatPrice(vehicle.price)}</strong></div></div>
        <p className="location"><MapPin size={14}/>{vehicle.location}</p>
      </div>
    </Link>
    <FavoriteButton id={vehicle.id} className="card-favorite"/>
  </article>;
}
