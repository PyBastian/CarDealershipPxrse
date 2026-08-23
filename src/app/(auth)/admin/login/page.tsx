import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LoginForm } from "@/components/login-form";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  if (await getServerSession(authOptions)) redirect("/admin");
  return <div className="admin-login"><div className="login-card"><div className="brand"><span className="brand-mark">LP</span>LO PRADO AUTOS</div><span className="eyebrow">Área privada</span><h1>Administración</h1><p>Gestiona inventario, estados y publicaciones.</p><LoginForm/></div></div>;
}
