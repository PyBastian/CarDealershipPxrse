"use client";

import { GithubConnection } from "@/components/admin/github-connection";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { useGithubToken } from "@/components/admin/token";

export default function SettingsPage() {
  const token = useGithubToken();
  if (!token) return <GithubConnection context="la configuración"/>;
  return <SettingsEditor token={token}/>;
}
