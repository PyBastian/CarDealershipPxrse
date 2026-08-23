"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return <form className="login-form" onSubmit={async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: data.get("email"), password: data.get("password"), redirect: false });
    if (result?.ok) router.push("/admin"); else { setError("Correo o contraseña incorrectos."); setLoading(false); }
  }}>
    <label>Correo<input required type="email" name="email" autoComplete="username"/></label>
    <label>Contraseña<input required type="password" name="password" autoComplete="current-password"/></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={loading}>{loading ? <LoaderCircle className="spin"/> : <LogIn/>}{loading ? "Ingresando…" : "Ingresar"}</button>
  </form>;
}
