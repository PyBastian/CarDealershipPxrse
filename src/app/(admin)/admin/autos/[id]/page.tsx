import { notFound } from "next/navigation";
import { VehicleForm } from "@/components/vehicle-form";
import { getAdminVehicles } from "@/lib/data";
export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const vehicle = (await getAdminVehicles()).find((item) => item.id === id); if (!vehicle) notFound(); return <div className="admin-page form-page"><div className="admin-heading"><div><span className="eyebrow">Inventario</span><h1>Editar {vehicle.make} {vehicle.model}</h1></div></div><VehicleForm vehicle={vehicle}/></div>; }
