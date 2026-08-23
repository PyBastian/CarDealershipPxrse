import Link from "next/link";
import { Plus } from "lucide-react";
import { VehicleCardAdmin } from "@/components/vehicle-card-admin";
import { getAdminVehicles } from "@/lib/data";

export default async function InventoryPage() {
  const vehicles = await getAdminVehicles();
  return <div className="admin-page"><div className="admin-heading"><div><span className="eyebrow">Gestión</span><h1>Inventario</h1><p>{vehicles.length} vehículos en total</p></div><Link className="button" href="/admin/autos/nuevo"><Plus/> Nuevo auto</Link></div><div className="admin-list">{vehicles.map((vehicle) => <VehicleCardAdmin key={vehicle.id} vehicle={vehicle}/>)}</div></div>;
}
