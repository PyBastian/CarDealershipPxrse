import Image from "next/image";
import Link from "next/link";
import { formatKm, formatPrice, labels } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

export function VehicleCardAdmin({ vehicle }: { vehicle: Vehicle }) {
  return <Link href={`/admin/autos/${vehicle.id}`} className="admin-vehicle-card">{vehicle.images[0] && <div><Image src={vehicle.images[0].url} alt="" fill sizes="100px"/></div>}<span><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.trim} · {formatKm(vehicle.mileageKm)}</small></span><b>{formatPrice(vehicle.price)}</b><em className={`status status-${vehicle.status.toLowerCase()}`}>{labels.status[vehicle.status]}</em></Link>;
}
