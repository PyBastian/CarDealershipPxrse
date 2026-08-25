"use client";

import { VehicleEditor } from "./vehicle-editor";
import { GithubConnection } from "./github-connection";
import { useGithubToken } from "./token";

export function EditorGate({ slug }: { slug?: string }) {
  const token = useGithubToken();
  if (!token) return <GithubConnection context={slug ? "este vehículo" : "el catálogo"}/>;
  return <VehicleEditor slug={slug} token={token}/>;
}
