import { inventoryVehicles } from "@/lib/inventory";
import { EditorGate } from "@/components/admin/editor-gate";

export function generateStaticParams() {
  return inventoryVehicles.map((vehicle) => ({ slug: vehicle.slug }));
}

export default async function AdminVehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditorGate slug={slug}/>;
}
