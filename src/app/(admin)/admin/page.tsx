import Link from "next/link";
import { ArrowRight, Car, CircleCheck, Clock3, Tag } from "lucide-react";
import { VehicleCardAdmin } from "@/components/vehicle-card-admin";
import { getAdminVehicles } from "@/lib/data";

export default async function AdminPage() {
  const vehicles = await getAdminVehicles();
  const stats = [{ label: "Autos", value: vehicles.length, icon: Car }, { label: "Disponibles", value: vehicles.filter((v) => v.status === "AVAILABLE").length, icon: CircleCheck }, { label: "Reservados", value: vehicles.filter((v) => v.status === "RESERVED").length, icon: Clock3 }, { label: "Vendidos", value: vehicles.filter((v) => v.status === "SOLD").length, icon: Tag }];
  return <div className="admin-page"><div className="admin-heading"><div><span className="eyebrow">Panel</span><h1>Resumen</h1></div><Link className="button" href="/admin/autos/nuevo">Nuevo auto</Link></div><div className="admin-stats">{stats.map(({ label, value, icon: Icon }) => <div key={label}><Icon/><strong>{value}</strong><span>{label}</span></div>)}</div><div className="admin-section-head"><h2>Actualizados recientemente</h2><Link href="/admin/autos">Ver inventario <ArrowRight/></Link></div><div className="admin-recent">{vehicles.slice(0, 4).map((vehicle) => <VehicleCardAdmin key={vehicle.id} vehicle={vehicle}/>)}</div></div>;
}
