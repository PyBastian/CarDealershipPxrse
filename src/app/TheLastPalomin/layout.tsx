import type { Metadata } from "next";
import { AdminToolbar } from "@/components/admin/admin-toolbar";

export const metadata: Metadata = { title: "The Last Palomin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="palomin-shell"><AdminToolbar/><main className="palomin-main">{children}</main></div>;
}
