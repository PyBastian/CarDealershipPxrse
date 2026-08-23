import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Car, LayoutDashboard, Plus, Settings } from "lucide-react";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!await getServerSession(authOptions)) redirect("/admin/login");
  return <div className="admin-shell"><aside className="admin-nav"><Link href="/admin" className="brand"><span className="brand-mark">N</span>NOVA</Link><nav><Link href="/admin"><LayoutDashboard/> Resumen</Link><Link href="/admin/autos"><Car/> Inventario</Link><Link href="/admin/autos/nuevo"><Plus/> Nuevo auto</Link><Link href="/admin/configuracion"><Settings/> Configuración</Link></nav><Link href="/">Ver sitio público ↗</Link></aside><div className="admin-main">{children}</div></div>;
}
