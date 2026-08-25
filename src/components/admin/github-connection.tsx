"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { OWNER, REPO } from "@/lib/github-admin/types";
import { validateToken } from "@/lib/github-admin/repository";
import { connectToken } from "./token";

export function GithubConnection({ context = "el catálogo" }: { context?: string }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    if (!token.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      await validateToken(token.trim());
      connectToken(token.trim());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos validar el token.");
    } finally {
      setPending(false);
    }
  }

  return <div className="palomin-connection-screen">
    <form className="login-card" onSubmit={connect}>
      <span className="brand"><span className="brand-mark">LP</span>THE LAST PALOMIN</span>
      <h1>Administrador del catálogo</h1>
      <p>Conecta tu cuenta de GitHub para editar {context}. Los cambios se guardan como commits en <strong>{OWNER}/{REPO}</strong>.</p>
      <label className="palomin-token-label">GitHub Access Token
        <input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="github_pat_…" autoComplete="off" spellCheck={false} required/>
      </label>
      <button className="button" type="submit" disabled={pending || !token.trim()}>{pending ? <><Loader2 className="spin" size={17}/> Validando…</> : "Conectar"}</button>
      {error && <p className="form-error">{error}</p>}
      <details className="palomin-token-help">
        <summary>Cómo crear el token</summary>
        <ol>
          <li>Abre GitHub → Settings → Developer settings → Fine-grained personal access tokens.</li>
          <li>Selecciona solo el repositorio <strong>{OWNER}/{REPO}</strong>.</li>
          <li>En permisos, marca <strong>Contents: Read and write</strong>.</li>
          <li>Pega el token aquí. Se guarda únicamente en este navegador.</li>
        </ol>
      </details>
      <Link className="text-link" href="/">Volver al sitio público</Link>
    </form>
  </div>;
}
